<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function __construct(
        protected OrderService $orderService
    ) {}

    /**
     * Display customer's orders
     */
    public function index(Request $request)
    {
        $query = Order::where('user_id', auth()->id())
            ->with(['items.product:id,name,slug', 'currency'])
            ->latest();

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $orders = $query->paginate(10);

        // Transform orders to hide internal pricing
        $orders->getCollection()->transform(function ($order) {
            return $this->orderService->getOrderForCustomer($order);
        });

        return Inertia::render('Frontend/Orders/Index', [
            'orders' => $orders,
            'filters' => [
                'status' => $request->status,
            ],
            'statuses' => $this->getOrderStatuses(),
        ]);
    }

    /**
     * Display a single order
     */
    public function show(Order $order)
    {
        // Verify the order belongs to current user
        if ($order->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $order->load([
            'items.product:id,name,slug,images',
            'items.variant',
            'items.seller:id,business_name',
            'shippingAddress',
            'billingAddress',
            'payments.gateway:id,name,slug',
            'currency',
        ]);

        $orderData = $this->orderService->getOrderForCustomer($order);

        return Inertia::render('Frontend/Orders/Show', [
            'order' => $orderData,
        ]);
    }

    /**
     * Cancel an order
     */
    public function cancel(Request $request, Order $order)
    {
        // Verify the order belongs to current user
        if ($order->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        // Only pending orders can be cancelled
        if (!in_array($order->status, ['pending', 'awaiting_payment'])) {
            return back()->with('error', 'This order cannot be cancelled.');
        }

        // Check if any items have been shipped
        $hasShippedItems = $order->items()->whereIn('status', ['shipped', 'delivered'])->exists();
        if ($hasShippedItems) {
            return back()->with('error', 'Cannot cancel order with shipped items.');
        }

        $this->orderService->updateOrderStatus(
            $order,
            'cancelled',
            $request->input('reason', 'Cancelled by customer')
        );

        return back()->with('success', 'Order has been cancelled.');
    }

    /**
     * Get available order statuses for filtering
     */
    protected function getOrderStatuses(): array
    {
        return [
            'pending' => 'Pending',
            'awaiting_payment' => 'Awaiting Payment',
            'processing' => 'Processing',
            'partially_shipped' => 'Partially Shipped',
            'shipped' => 'Shipped',
            'delivered' => 'Delivered',
            'cancelled' => 'Cancelled',
            'refunded' => 'Refunded',
        ];
    }
}
