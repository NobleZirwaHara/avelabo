<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Models\Refund;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function __construct(
        protected OrderService $orderService
    ) {}

    /**
     * Display a listing of all orders
     */
    public function index(Request $request)
    {
        $query = Order::with([
            'user:id,name,email',
            'items.seller:id,business_name',
            'currency:id,code,symbol',
            'latestPayment',
        ]);

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhereHas('user', fn($u) => $u->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%"));
            });
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Payment status filter
        if ($request->filled('payment_status')) {
            $query->whereHas('latestPayment', function ($q) use ($request) {
                $q->where('status', $request->payment_status);
            });
        }

        // Date range
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Seller filter
        if ($request->filled('seller_id')) {
            $query->whereHas('items', function ($q) use ($request) {
                $q->where('seller_id', $request->seller_id);
            });
        }

        $orders = $query->latest()
            ->paginate(20)
            ->withQueryString();

        // Transform for admin view
        $orders->getCollection()->transform(function ($order) {
            return $this->orderService->getOrderForAdmin($order);
        });

        // Stats
        $stats = [
            'total' => Order::count(),
            'pending' => Order::where('status', 'pending')->count(),
            'processing' => Order::where('status', 'processing')->count(),
            'shipped' => Order::whereIn('status', ['shipped', 'partially_shipped'])->count(),
            'delivered' => Order::where('status', 'delivered')->count(),
            'cancelled' => Order::where('status', 'cancelled')->count(),
        ];

        // Revenue stats
        $revenue = [
            'total' => Order::where('status', '!=', 'cancelled')->sum('total'),
            'today' => Order::where('status', '!=', 'cancelled')
                ->whereDate('created_at', today())
                ->sum('total'),
            'this_month' => Order::where('status', '!=', 'cancelled')
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('total'),
        ];

        return Inertia::render('Admin/Orders/Index', [
            'orders' => $orders,
            'stats' => $stats,
            'revenue' => $revenue,
            'filters' => $request->only(['search', 'status', 'payment_status', 'date_from', 'date_to', 'seller_id']),
            'statuses' => $this->getOrderStatuses(),
        ]);
    }

    /**
     * Display a specific order with full details
     */
    public function show(Order $order)
    {
        $order->load([
            'user:id,name,email,phone',
            'items.product:id,name,slug',
            'items.variant',
            'items.seller:id,business_name,user_id',
            'shippingAddress',
            'billingAddress',
            'payments.gateway:id,name,slug',
            'statusHistory.creator:id,name',
            'refunds',
            'currency',
        ]);

        $orderData = $this->orderService->getOrderForAdmin($order);

        return Inertia::render('Admin/Orders/Show', [
            'order' => $orderData,
            'statuses' => $this->getOrderStatuses(),
            'itemStatuses' => $this->getItemStatuses(),
        ]);
    }

    /**
     * Update order or item status
     */
    public function updateStatus(Request $request, Order $order)
    {
        $validated = $request->validate([
            'type' => ['required', 'in:order,item'],
            'item_id' => ['required_if:type,item', 'exists:order_items,id'],
            'status' => ['required', 'string'],
            'comment' => ['nullable', 'string', 'max:500'],
            'tracking_number' => ['nullable', 'string', 'max:100'],
            'tracking_carrier' => ['nullable', 'string', 'max:50'],
            'notify_customer' => ['boolean'],
        ]);

        DB::beginTransaction();

        try {
            if ($validated['type'] === 'order') {
                // Update entire order status
                $this->orderService->updateOrderStatus(
                    $order,
                    $validated['status'],
                    $validated['comment'],
                    Auth::user()
                );

                // Update all items to match (if applicable)
                if (in_array($validated['status'], ['cancelled', 'refunded'])) {
                    $order->items()->update(['status' => $validated['status']]);
                }
            } else {
                // Update specific item
                $item = OrderItem::findOrFail($validated['item_id']);

                $updateData = ['status' => $validated['status']];

                if ($validated['status'] === 'shipped') {
                    $updateData['shipped_at'] = now();
                    if (!empty($validated['tracking_number'])) {
                        $updateData['tracking_number'] = $validated['tracking_number'];
                    }
                    if (!empty($validated['tracking_carrier'])) {
                        $updateData['tracking_carrier'] = $validated['tracking_carrier'];
                    }
                } elseif ($validated['status'] === 'delivered') {
                    $updateData['delivered_at'] = now();
                }

                $item->update($updateData);

                // Create history record
                OrderStatusHistory::create([
                    'order_id' => $order->id,
                    'order_item_id' => $item->id,
                    'status' => $validated['status'],
                    'comment' => $validated['comment'] ?? "Item status updated to {$validated['status']}",
                    'changed_by' => Auth::id(),
                ]);

                // Sync order status
                $this->syncOrderStatusFromItems($order);
            }

            DB::commit();

            // TODO: Send notification if notify_customer is true

            return back()->with('success', 'Status updated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to update status: ' . $e->getMessage());
        }
    }

    /**
     * Process a refund
     */
    public function refund(Request $request, Order $order)
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01', 'max:' . $order->total],
            'reason' => ['required', 'string', 'max:500'],
            'items' => ['nullable', 'array'],
            'items.*' => ['exists:order_items,id'],
            'refund_type' => ['required', 'in:full,partial'],
        ]);

        DB::beginTransaction();

        try {
            $refundAmount = $validated['refund_type'] === 'full'
                ? $order->total
                : $validated['amount'];

            // Create refund record
            $refund = Refund::create([
                'order_id' => $order->id,
                'amount' => $refundAmount,
                'reason' => $validated['reason'],
                'status' => 'pending',
                'processed_by' => Auth::id(),
            ]);

            // Mark specified items as refunded
            if (!empty($validated['items'])) {
                OrderItem::whereIn('id', $validated['items'])
                    ->where('order_id', $order->id)
                    ->update(['status' => 'refunded']);
            }

            // If full refund, update order status
            if ($validated['refund_type'] === 'full') {
                $this->orderService->updateOrderStatus(
                    $order,
                    'refunded',
                    'Full refund processed: ' . $validated['reason'],
                    Auth::user()
                );
            }

            // TODO: Process refund through payment gateway

            DB::commit();

            return back()->with('success', 'Refund processed successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to process refund: ' . $e->getMessage());
        }
    }

    /**
     * Sync order status based on item statuses
     */
    protected function syncOrderStatusFromItems(Order $order): void
    {
        $order->load('items');

        $statuses = $order->items->pluck('status')->unique();

        if ($statuses->count() === 1 && $statuses->first() === 'delivered') {
            $order->update([
                'status' => 'delivered',
                'delivered_at' => now(),
            ]);
        } elseif ($statuses->every(fn($s) => in_array($s, ['shipped', 'delivered']))) {
            $order->update([
                'status' => 'shipped',
                'shipped_at' => $order->shipped_at ?? now(),
            ]);
        } elseif ($statuses->contains('shipped') || $statuses->contains('delivered')) {
            $order->update(['status' => 'partially_shipped']);
        } elseif ($statuses->count() === 1 && $statuses->first() === 'cancelled') {
            $order->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
            ]);
        }
    }

    /**
     * Get order statuses
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

    /**
     * Get item statuses
     */
    protected function getItemStatuses(): array
    {
        return [
            'pending' => 'Pending',
            'processing' => 'Processing',
            'shipped' => 'Shipped',
            'delivered' => 'Delivered',
            'cancelled' => 'Cancelled',
            'refunded' => 'Refunded',
        ];
    }
}
