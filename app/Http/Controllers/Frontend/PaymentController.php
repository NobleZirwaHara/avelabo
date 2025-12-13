<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentGateway;
use App\Services\CartService;
use App\Services\OrderService;
use App\Services\PaymentGateway\PaymentGatewayFactory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function __construct(
        protected OrderService $orderService,
        protected CartService $cartService
    ) {}

    /**
     * Initiate payment for an order
     */
    public function initiate(Request $request, Order $order)
    {
        // Verify the order belongs to current user or session
        if ($order->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        // Check order is in pending state
        if ($order->status !== 'pending') {
            return redirect()->route('customer.orders.show', $order)
                ->with('error', 'This order has already been processed.');
        }

        // Get payment gateway from session or request
        $gatewayId = session('checkout_payment_gateway') ?? $request->input('payment_gateway_id');

        if (!$gatewayId) {
            return redirect()->route('checkout')
                ->with('error', 'Please select a payment method.');
        }

        $paymentGateway = PaymentGateway::find($gatewayId);

        if (!$paymentGateway || !$paymentGateway->is_active) {
            return redirect()->route('checkout')
                ->with('error', 'Selected payment method is not available.');
        }

        try {
            // Handle Cash on Delivery - no payment gateway needed
            if ($paymentGateway->slug === 'cash-on-delivery') {
                // Create payment record for COD
                Payment::create([
                    'order_id' => $order->id,
                    'payment_gateway_id' => $paymentGateway->id,
                    'amount' => $order->total,
                    'currency_id' => $order->currency_id,
                    'status' => 'pending',
                    'payment_method' => 'cod',
                ]);

                // Update order status
                $this->orderService->updateOrderStatus($order, 'processing', 'Cash on Delivery order placed');

                // Clear cart and session
                $this->clearPendingCart();
                session()->forget('checkout_payment_gateway');

                return redirect()->route('checkout.success', ['order' => $order->order_number]);
            }

            // Create payment record
            $payment = Payment::create([
                'order_id' => $order->id,
                'payment_gateway_id' => $paymentGateway->id,
                'amount' => $order->total,
                'currency_id' => $order->currency_id,
                'status' => 'pending',
                'payment_method' => $paymentGateway->slug,
            ]);

            // Initialize payment with gateway
            $gateway = PaymentGatewayFactory::create($paymentGateway->slug);
            $response = $gateway->initializePayment($order, [
                'callback_url' => route('payment.callback'),
                'return_url' => route('checkout.cancel', ['order' => $order->order_number]),
            ]);

            if ($response->isSuccessful()) {
                // Update payment with transaction ID
                $payment->update([
                    'transaction_id' => $response->transactionId,
                    'gateway_response' => $response->data,
                ]);

                // Clear the session
                session()->forget('checkout_payment_gateway');

                // Redirect to payment gateway
                if ($response->hasRedirect()) {
                    
                    Log::info('Redirecting to payment gateway: ' . $response->redirectUrl);

                    return Inertia::location($response->redirectUrl);
                }

                // If no redirect (direct payment success), clear cart
                $this->clearPendingCart();
                return redirect()->route('checkout.success', ['order' => $order->order_number]);
            }

            // Payment initialization failed
            $payment->update([
                'status' => 'failed',
                'failure_reason' => $response->message,
                'failed_at' => now(),
            ]);

            return redirect()->route('checkout')
                ->with('error', $response->message);

        } catch (\Exception $e) {
            Log::error('Payment initiation error: ' . $e->getMessage());

            return redirect()->route('checkout')
                ->with('error', 'Payment initialization failed. Please try again.');
        }
    }

    /**
     * Handle payment callback (redirect from gateway)
     */
    public function callback(Request $request)
    {
        $reference = $request->input('tx_ref') ?? $request->input('reference') ?? $request->input('order');

        if (!$reference) {
            return redirect()->route('home')
                ->with('error', 'Invalid payment callback.');
        }

        // Find the order
        $order = Order::where('order_number', $reference)->first();

        if (!$order) {
            return redirect()->route('home')
                ->with('error', 'Order not found.');
        }

        // Get the latest payment
        $payment = $order->latestPayment;

        if (!$payment) {
            return redirect()->route('checkout.success', ['order' => $order->order_number])
                ->with('warning', 'Payment record not found.');
        }

        try {
            // Verify payment with gateway
            $gateway = PaymentGatewayFactory::createFromId($payment->payment_gateway_id);
            $response = $gateway->verifyPayment($reference);

            if ($response->isSuccessful()) {
                // Update payment
                $payment->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                    'gateway_response' => $response->data,
                ]);

                // Update order
                $this->orderService->updateOrderStatus($order, 'processing', 'Payment confirmed');

                // Clear the cart after successful payment
                $this->clearPendingCart();

                return redirect()->route('checkout.success', ['order' => $order->order_number]);
            }

            // Payment not successful yet - might be pending
            return redirect()->route('checkout.success', ['order' => $order->order_number])
                ->with('info', 'Your payment is being processed. We will notify you once confirmed.');

        } catch (\Exception $e) {
            Log::error('Payment callback error: ' . $e->getMessage());

            return redirect()->route('checkout.success', ['order' => $order->order_number])
                ->with('warning', 'Unable to verify payment status. Please contact support if payment was deducted.');
        }
    }

    /**
     * Handle webhook from payment gateway
     */
    public function webhook(Request $request, string $gateway)
    {
        Log::info("Payment webhook received from {$gateway}", $request->all());

        try {
            $paymentGateway = PaymentGateway::where('slug', $gateway)->firstOrFail();
            $gatewayService = PaymentGatewayFactory::create($gateway);

            $response = $gatewayService->handleWebhook($request->all());

            if ($response->isSuccessful() && $response->transactionId) {
                // Find the order by reference
                $order = Order::where('order_number', $response->transactionId)->first();

                if ($order) {
                    $payment = $order->latestPayment;

                    if ($payment && $payment->status !== 'paid') {
                        $payment->update([
                            'status' => 'paid',
                            'paid_at' => now(),
                            'gateway_response' => $response->data,
                        ]);

                        $this->orderService->updateOrderStatus($order, 'processing', 'Payment confirmed via webhook');

                        // Clear cart associated with this order's user
                        $userCart = Cart::where('user_id', $order->user_id)->first();
                        if ($userCart) {
                            $this->cartService->clearCart($userCart);
                        }
                    }
                }

                return response()->json(['status' => 'success'], 200);
            }

            return response()->json(['status' => 'failed', 'message' => $response->message], 400);

        } catch (\Exception $e) {
            Log::error("Webhook error for {$gateway}: " . $e->getMessage());
            return response()->json(['status' => 'error'], 500);
        }
    }

    /**
     * Verify payment manually
     */
    public function verify(Request $request, string $reference)
    {
        $order = Order::where('order_number', $reference)->first();

        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order not found'], 404);
        }

        $payment = $order->latestPayment;

        if (!$payment) {
            return response()->json(['success' => false, 'message' => 'Payment not found'], 404);
        }

        try {
            $gateway = PaymentGatewayFactory::createFromId($payment->payment_gateway_id);
            $response = $gateway->verifyPayment($reference);

            return response()->json([
                'success' => $response->isSuccessful(),
                'message' => $response->message,
                'payment_status' => $response->isSuccessful() ? 'paid' : 'pending',
            ]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Verification failed'], 500);
        }
    }

    /**
     * Handle payment cancellation
     */
    public function cancel(Request $request)
    {
        $reference = $request->input('order') ?? $request->input('reference');

        return redirect()->route('checkout.cancel', ['order' => $reference]);
    }

    /**
     * Clear the pending cart after successful payment
     */
    protected function clearPendingCart(): void
    {
        $cartId = session('pending_order_cart_id');

        if ($cartId) {
            $cart = Cart::find($cartId);
            if ($cart) {
                $this->cartService->clearCart($cart);
            }
            session()->forget('pending_order_cart_id');
        }
    }
}
