<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function __construct(
        protected OrderService $orderService
    ) {}

    /**
     * Display a listing of orders containing seller's items
     */
    public function index(Request $request)
    {
        $seller = Auth::user()->seller;

        // Get orders that contain items from this seller
        $query = Order::whereHas('items', function ($q) use ($seller) {
                $q->where('seller_id', $seller->id);
            })
            ->with([
                'user:id,name,email',
                'currency:id,code,symbol',
                'items' => function ($q) use ($seller) {
                    $q->where('seller_id', $seller->id)
                      ->with('product:id,name,slug');
                },
            ]);

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhereHas('user', fn($u) => $u->where('name', 'like', "%{$search}%"));
            });
        }

        // Status filter - for sellers we filter by item status
        if ($request->filled('status')) {
            $status = $request->status;
            $query->whereHas('items', function ($q) use ($seller, $status) {
                $q->where('seller_id', $seller->id)
                  ->where('status', $status);
            });
        }

        // Date filters
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $orders = $query->latest()
            ->paginate(15)
            ->withQueryString();

        // Transform orders for seller view (only their items, hide markup)
        $orders->getCollection()->transform(function ($order) use ($seller) {
            return $this->orderService->getOrderForSeller($order, $seller->id);
        });

        // Stats for seller's items
        $stats = [
            'pending' => OrderItem::where('seller_id', $seller->id)->where('status', 'pending')->count(),
            'processing' => OrderItem::where('seller_id', $seller->id)->where('status', 'processing')->count(),
            'shipped' => OrderItem::where('seller_id', $seller->id)->where('status', 'shipped')->count(),
            'delivered' => OrderItem::where('seller_id', $seller->id)->where('status', 'delivered')->count(),
        ];

        return Inertia::render('Seller/Orders/Index', [
            'orders' => $orders,
            'stats' => $stats,
            'filters' => $request->only(['status', 'search', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Display the specified order (only seller's items)
     */
    public function show(Order $order)
    {
        $seller = Auth::user()->seller;

        // Check if seller has items in this order
        $hasItems = $order->items()->where('seller_id', $seller->id)->exists();

        if (!$hasItems) {
            abort(403, 'You do not have items in this order.');
        }

        $order->load([
            'user:id,name,email,phone',
            'items' => function ($q) use ($seller) {
                $q->where('seller_id', $seller->id)
                  ->with(['product:id,name,slug', 'variant']);
            },
            'shippingAddress',
            'currency',
        ]);

        $orderData = $this->orderService->getOrderForSeller($order, $seller->id);

        return Inertia::render('Seller/Orders/Show', [
            'order' => $orderData,
            'availableStatuses' => $this->getAvailableStatuses(),
        ]);
    }

    /**
     * Update item status (seller can only update their own items)
     */
    public function updateStatus(Request $request, Order $order)
    {
        $seller = Auth::user()->seller;

        $validated = $request->validate([
            'item_id' => ['required', 'exists:order_items,id'],
            'status' => ['required', 'in:processing,shipped,delivered,cancelled'],
            'comment' => ['nullable', 'string', 'max:500'],
            'tracking_number' => ['nullable', 'string', 'max:100'],
            'tracking_carrier' => ['nullable', 'string', 'max:50'],
        ]);

        // Find the item and verify ownership
        $item = OrderItem::findOrFail($validated['item_id']);

        if ($item->seller_id !== $seller->id) {
            abort(403, 'You cannot update this item.');
        }

        if ($item->order_id !== $order->id) {
            abort(400, 'Item does not belong to this order.');
        }

        // Validate status transition
        $availableStatuses = $this->getAvailableStatusesForItem($item->status);
        if (!in_array($validated['status'], $availableStatuses)) {
            return back()->with('error', 'Invalid status transition.');
        }

        // Update item
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

        // Create status history
        OrderStatusHistory::create([
            'order_id' => $order->id,
            'order_item_id' => $item->id,
            'status' => $validated['status'],
            'comment' => $validated['comment'] ?? "Item {$item->product_name} marked as {$validated['status']}",
            'changed_by' => Auth::id(),
        ]);

        // Update overall order status based on all items
        $this->updateOrderStatusFromItems($order);

        return back()->with('success', 'Item status updated successfully.');
    }

    /**
     * Bulk update items status
     */
    public function bulkUpdateStatus(Request $request, Order $order)
    {
        $seller = Auth::user()->seller;

        $validated = $request->validate([
            'item_ids' => ['required', 'array'],
            'item_ids.*' => ['exists:order_items,id'],
            'status' => ['required', 'in:processing,shipped,delivered'],
            'tracking_number' => ['nullable', 'string', 'max:100'],
            'tracking_carrier' => ['nullable', 'string', 'max:50'],
        ]);

        $items = OrderItem::whereIn('id', $validated['item_ids'])
            ->where('seller_id', $seller->id)
            ->where('order_id', $order->id)
            ->get();

        if ($items->isEmpty()) {
            return back()->with('error', 'No valid items to update.');
        }

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

        foreach ($items as $item) {
            $item->update($updateData);
        }

        // Create status history
        OrderStatusHistory::create([
            'order_id' => $order->id,
            'status' => $validated['status'],
            'comment' => "Bulk update: {$items->count()} items marked as {$validated['status']}",
            'changed_by' => Auth::id(),
        ]);

        $this->updateOrderStatusFromItems($order);

        return back()->with('success', "{$items->count()} items updated successfully.");
    }

    /**
     * Update overall order status based on item statuses
     */
    protected function updateOrderStatusFromItems(Order $order): void
    {
        $order->load('items');

        $statuses = $order->items->pluck('status')->unique();

        // If all items are delivered
        if ($statuses->count() === 1 && $statuses->first() === 'delivered') {
            $order->update([
                'status' => 'delivered',
                'delivered_at' => now(),
            ]);
            return;
        }

        // If all items are shipped or delivered
        if ($statuses->every(fn($s) => in_array($s, ['shipped', 'delivered']))) {
            $order->update([
                'status' => 'shipped',
                'shipped_at' => $order->shipped_at ?? now(),
            ]);
            return;
        }

        // If some items are shipped
        if ($statuses->contains('shipped') || $statuses->contains('delivered')) {
            $order->update(['status' => 'partially_shipped']);
            return;
        }

        // If all items are processing or cancelled
        if ($statuses->every(fn($s) => in_array($s, ['processing', 'cancelled']))) {
            $order->update(['status' => 'processing']);
            return;
        }

        // If all cancelled
        if ($statuses->count() === 1 && $statuses->first() === 'cancelled') {
            $order->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
            ]);
            return;
        }
    }

    /**
     * Get available status transitions for filter dropdown
     */
    protected function getAvailableStatuses(): array
    {
        return [
            'pending' => 'Pending',
            'processing' => 'Processing',
            'shipped' => 'Shipped',
            'delivered' => 'Delivered',
            'cancelled' => 'Cancelled',
        ];
    }

    /**
     * Get available status transitions for a specific item status
     */
    protected function getAvailableStatusesForItem(string $currentStatus): array
    {
        return match ($currentStatus) {
            'pending' => ['processing', 'cancelled'],
            'processing' => ['shipped', 'cancelled'],
            'shipped' => ['delivered'],
            'delivered' => [],
            'cancelled' => [],
            default => [],
        };
    }
}
