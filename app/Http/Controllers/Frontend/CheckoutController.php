<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Models\PaymentGateway;
use App\Services\CartService;
use App\Services\CheckoutService;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CheckoutController extends Controller
{
    public function __construct(
        protected CartService $cartService,
        protected CheckoutService $checkoutService,
        protected OrderService $orderService
    ) {}

    /**
     * Display checkout page
     */
    public function show()
    {
        $cart = $this->cartService->getOrCreateCart();
        $cartData = $this->cartService->calculateTotals($cart);

        // Check if cart is empty
        if (empty($cartData['items'])) {
            return redirect()->route('cart')->with('error', 'Your cart is empty');
        }

        // Get available payment gateways
        $paymentGateways = PaymentGateway::active()
            ->ordered()
            ->get(['id', 'name', 'slug', 'display_name', 'description', 'logo']);

        // Get countries for address form
        $countries = Country::orderBy('name')->get(['id', 'name', 'code']);

        // Get user's addresses if logged in
        $user = Auth::user();
        $savedAddresses = [];
        if ($user) {
            $savedAddresses = $user->addresses()
                ->with('country')
                ->get()
                ->map(fn($addr) => [
                    'id' => $addr->id,
                    'label' => $addr->label,
                    'name' => $addr->full_name,
                    'address' => $addr->full_address,
                    'is_default' => $addr->is_default,
                    'is_billing' => $addr->is_billing,
                ]);
        }

        return Inertia::render('Frontend/Checkout', [
            'cart' => $cartData,
            'paymentGateways' => $paymentGateways,
            'countries' => $countries,
            'savedAddresses' => $savedAddresses,
            'user' => $user ? [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
            ] : null,
        ]);
    }

    /**
     * Process checkout
     */
    public function process(Request $request)
    {
        $validated = $request->validate([
            // Billing info
            'billing.first_name' => 'required|string|max:100',
            'billing.last_name' => 'required|string|max:100',
            'billing.email' => 'required|email|max:255',
            'billing.phone' => 'required|string|max:20',
            'billing.address_line_1' => 'required|string|max:255',
            'billing.address_line_2' => 'nullable|string|max:255',
            'billing.city' => 'required|string|max:100',
            'billing.state' => 'nullable|string|max:100',
            'billing.postal_code' => 'nullable|string|max:20',
            'billing.country_id' => 'required|exists:countries,id',

            // Shipping info
            'shipping.same_as_billing' => 'boolean',
            'shipping.first_name' => 'required_if:shipping.same_as_billing,false|nullable|string|max:100',
            'shipping.last_name' => 'required_if:shipping.same_as_billing,false|nullable|string|max:100',
            'shipping.phone' => 'required_if:shipping.same_as_billing,false|nullable|string|max:20',
            'shipping.address_line_1' => 'required_if:shipping.same_as_billing,false|nullable|string|max:255',
            'shipping.address_line_2' => 'nullable|string|max:255',
            'shipping.city' => 'required_if:shipping.same_as_billing,false|nullable|string|max:100',
            'shipping.state' => 'nullable|string|max:100',
            'shipping.postal_code' => 'nullable|string|max:20',
            'shipping.country_id' => 'required_if:shipping.same_as_billing,false|nullable|exists:countries,id',

            // Payment
            'payment_gateway_id' => 'required|exists:payment_gateways,id',

            // Optional
            'notes' => 'nullable|string|max:1000',
            'create_account' => 'boolean',
        ]);

        $cart = $this->cartService->getOrCreateCart();

        // Validate checkout
        $errors = $this->checkoutService->validateCheckout(
            $cart,
            $validated['billing'],
            $validated['shipping'] ?? []
        );

        if (!empty($errors)) {
            return back()->withErrors($errors);
        }

        try {
            // Process checkout
            $order = $this->checkoutService->processCheckout(
                $cart,
                $validated['billing'],
                $validated['shipping'] ?? ['same_as_billing' => true],
                null,
                $validated['notes'] ?? null
            );

            // Store payment gateway selection in session for payment initiation
            session(['checkout_payment_gateway' => $validated['payment_gateway_id']]);

            // Redirect to payment initiation
            return redirect()->route('payment.initiate', $order);

        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Checkout success page
     */
    public function success(Request $request)
    {
        $orderNumber = $request->get('order');

        if (!$orderNumber) {
            return redirect()->route('home');
        }

        $order = \App\Models\Order::where('order_number', $orderNumber)->first();

        if (!$order) {
            return redirect()->route('home');
        }

        // Get order data for customer view
        $orderData = $this->orderService->getOrderForCustomer($order);

        return Inertia::render('Frontend/CheckoutSuccess', [
            'order' => $orderData,
        ]);
    }

    /**
     * Checkout cancelled page
     */
    public function cancel(Request $request)
    {
        $orderNumber = $request->get('order');

        return Inertia::render('Frontend/CheckoutCancel', [
            'order_number' => $orderNumber,
            'message' => 'Your payment was cancelled. You can try again or contact support.',
        ]);
    }
}
