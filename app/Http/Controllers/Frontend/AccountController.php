<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Models\Order;
use App\Models\UserAddress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class AccountController extends Controller
{
    /**
     * Display the account dashboard
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Get recent orders with items
        $orders = Order::with(['items.product:id,name,slug', 'currency:id,code,symbol'])
            ->forUser($user->id)
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(fn($order) => $this->transformOrder($order));

        // Get addresses
        $addresses = $user->addresses()
            ->with(['country:id,name,code', 'region:id,name', 'city:id,name'])
            ->get()
            ->map(fn($address) => $this->transformAddress($address));

        // Get default billing address
        $billingAddress = $user->addresses()
            ->with(['country:id,name,code', 'region:id,name', 'city:id,name'])
            ->where('is_billing', true)
            ->first();

        // Get default shipping address
        $shippingAddress = $user->addresses()
            ->with(['country:id,name,code', 'region:id,name', 'city:id,name'])
            ->where('is_default', true)
            ->first();

        // Get countries for address forms
        $countries = Country::active()
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('Frontend/Account', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'first_name' => $this->getFirstName($user->name),
                'last_name' => $this->getLastName($user->name),
                'display_name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
                'email_verified' => $user->hasVerifiedEmail(),
                'created_at' => $user->created_at->format('F j, Y'),
            ],
            'orders' => $orders,
            'addresses' => $addresses,
            'billingAddress' => $billingAddress ? $this->transformAddress($billingAddress) : null,
            'shippingAddress' => $shippingAddress ? $this->transformAddress($shippingAddress) : null,
            'countries' => $countries,
        ]);
    }

    /**
     * Update account details
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:20'],
        ]);

        $user->update([
            'name' => $validated['first_name'] . ' ' . $validated['last_name'],
            'phone' => $validated['phone'] ?? $user->phone,
        ]);

        return back()->with('success', 'Profile updated successfully.');
    }

    /**
     * Update password
     */
    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'new_password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['new_password']),
        ]);

        return back()->with('success', 'Password updated successfully.');
    }

    /**
     * Store a new address
     */
    public function storeAddress(Request $request)
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:50'],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:20'],
            'address_line_1' => ['required', 'string', 'max:255'],
            'address_line_2' => ['nullable', 'string', 'max:255'],
            'city_name' => ['required', 'string', 'max:100'],
            'region_name' => ['nullable', 'string', 'max:100'],
            'country_id' => ['required', 'exists:countries,id'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'is_default' => ['boolean'],
            'is_billing' => ['boolean'],
        ]);

        $user = $request->user();

        // If this is set as default, unset other defaults
        if ($validated['is_default'] ?? false) {
            $user->addresses()->update(['is_default' => false]);
        }

        // If this is set as billing, unset other billing
        if ($validated['is_billing'] ?? false) {
            $user->addresses()->update(['is_billing' => false]);
        }

        $user->addresses()->create($validated);

        return back()->with('success', 'Address added successfully.');
    }

    /**
     * Update an existing address
     */
    public function updateAddress(Request $request, UserAddress $address)
    {
        // Ensure user owns this address
        if ($address->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'label' => ['required', 'string', 'max:50'],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:20'],
            'address_line_1' => ['required', 'string', 'max:255'],
            'address_line_2' => ['nullable', 'string', 'max:255'],
            'city_name' => ['required', 'string', 'max:100'],
            'region_name' => ['nullable', 'string', 'max:100'],
            'country_id' => ['required', 'exists:countries,id'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'is_default' => ['boolean'],
            'is_billing' => ['boolean'],
        ]);

        $user = $request->user();

        // If this is set as default, unset other defaults
        if ($validated['is_default'] ?? false) {
            $user->addresses()->where('id', '!=', $address->id)->update(['is_default' => false]);
        }

        // If this is set as billing, unset other billing
        if ($validated['is_billing'] ?? false) {
            $user->addresses()->where('id', '!=', $address->id)->update(['is_billing' => false]);
        }

        $address->update($validated);

        return back()->with('success', 'Address updated successfully.');
    }

    /**
     * Delete an address
     */
    public function destroyAddress(Request $request, UserAddress $address)
    {
        // Ensure user owns this address
        if ($address->user_id !== $request->user()->id) {
            abort(403);
        }

        $address->delete();

        return back()->with('success', 'Address deleted successfully.');
    }

    /**
     * Set an address as default
     */
    public function setDefaultAddress(Request $request, UserAddress $address)
    {
        // Ensure user owns this address
        if ($address->user_id !== $request->user()->id) {
            abort(403);
        }

        $user = $request->user();

        // Unset all other default addresses
        $user->addresses()->update(['is_default' => false]);

        // Set this one as default
        $address->update(['is_default' => true]);

        return back()->with('success', 'Default address updated.');
    }

    /**
     * Track an order by order number
     */
    public function trackOrder(Request $request)
    {
        $validated = $request->validate([
            'order_id' => ['required', 'string'],
            'billing_email' => ['required', 'email'],
        ]);

        $order = Order::where('order_number', $validated['order_id'])
            ->whereHas('user', function ($query) use ($validated) {
                $query->where('email', $validated['billing_email']);
            })
            ->with(['items.product:id,name,slug', 'statusHistory'])
            ->first();

        if (!$order) {
            return back()->withErrors([
                'order_id' => 'Order not found. Please check your order number and email.',
            ]);
        }

        return back()->with('tracked_order', $this->transformOrder($order, true));
    }

    /**
     * Transform order for frontend display
     */
    protected function transformOrder(Order $order, bool $includeHistory = false): array
    {
        $data = [
            'id' => $order->order_number,
            'date' => $order->created_at->format('F j, Y'),
            'status' => ucfirst($order->status),
            'total' => $this->formatCurrency($order->total, $order->currency),
            'items' => $order->items->count(),
            'products' => $order->items->map(fn($item) => [
                'name' => $item->product?->name ?? $item->product_name,
                'quantity' => $item->quantity,
                'price' => $this->formatCurrency($item->display_price),
            ]),
        ];

        if ($includeHistory) {
            $data['tracking_number'] = $order->tracking_number;
            $data['shipped_at'] = $order->shipped_at?->format('F j, Y');
            $data['delivered_at'] = $order->delivered_at?->format('F j, Y');
            $data['history'] = $order->statusHistory->map(fn($history) => [
                'status' => ucfirst($history->status),
                'notes' => $history->notes,
                'date' => $history->created_at->format('F j, Y H:i'),
            ]);
        }

        return $data;
    }

    /**
     * Transform address for frontend display
     */
    protected function transformAddress(UserAddress $address): array
    {
        return [
            'id' => $address->id,
            'label' => $address->label,
            'first_name' => $address->first_name,
            'last_name' => $address->last_name,
            'full_name' => $address->full_name,
            'phone' => $address->phone,
            'address_line_1' => $address->address_line_1,
            'address_line_2' => $address->address_line_2,
            'city_name' => $address->city_name ?? $address->city?->name,
            'region_name' => $address->region_name ?? $address->region?->name,
            'country_name' => $address->country?->name,
            'country_id' => $address->country_id,
            'postal_code' => $address->postal_code,
            'is_default' => $address->is_default,
            'is_billing' => $address->is_billing,
            'full_address' => $address->full_address,
        ];
    }

    /**
     * Format currency amount
     */
    protected function formatCurrency($amount, $currency = null): string
    {
        $symbol = $currency?->symbol ?? 'MWK';
        return $symbol . ' ' . number_format($amount, 0);
    }

    /**
     * Extract first name from full name
     */
    protected function getFirstName(?string $name): string
    {
        if (!$name) return '';
        $parts = explode(' ', $name);
        return $parts[0] ?? '';
    }

    /**
     * Extract last name from full name
     */
    protected function getLastName(?string $name): string
    {
        if (!$name) return '';
        $parts = explode(' ', $name);
        array_shift($parts);
        return implode(' ', $parts);
    }
}
