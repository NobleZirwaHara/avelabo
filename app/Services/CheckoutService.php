<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\Currency;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Models\UserAddress;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CheckoutService
{
    public function __construct(
        protected CartService $cartService,
        protected PriceService $priceService,
        protected MarkupService $markupService,
        protected OrderService $orderService
    ) {}

    /**
     * Validate checkout data
     */
    public function validateCheckout(Cart $cart, array $billingData, array $shippingData): array
    {
        $errors = [];

        // Check cart is not empty
        if ($cart->items->isEmpty()) {
            $errors['cart'] = 'Your cart is empty';
        }

        // Validate stock
        $stockErrors = $this->cartService->validateCartStock($cart);
        if (!empty($stockErrors)) {
            $errors['stock'] = $stockErrors;
        }

        // Validate required billing fields
        $requiredBillingFields = ['first_name', 'last_name', 'email', 'phone', 'address_line_1', 'city', 'country_id'];
        foreach ($requiredBillingFields as $field) {
            if (empty($billingData[$field])) {
                $errors["billing.{$field}"] = "This field is required";
            }
        }

        // Validate email format
        if (!empty($billingData['email']) && !filter_var($billingData['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['billing.email'] = 'Invalid email address';
        }

        return $errors;
    }

    /**
     * Create a user account via Quick Checkout
     */
    public function createQuickCheckoutUser(string $email, ?string $phone, string $firstName, string $lastName): User
    {
        // Check if user already exists
        $existingUser = User::where('email', $email)->first();
        if ($existingUser) {
            return $existingUser;
        }

        // Generate random password
        $password = Str::random(12);

        $user = User::create([
            'name' => trim("{$firstName} {$lastName}"),
            'email' => $email,
            'phone' => $phone,
            'password' => Hash::make($password),
            'status' => 'active',
        ]);

        // TODO: Send welcome email with password reset link
        // Mail::to($user)->send(new QuickCheckoutWelcome($user, $password));

        return $user;
    }

    /**
     * Create or update user address
     */
    public function createOrUpdateAddress(User $user, array $addressData, string $type = 'billing'): UserAddress
    {
        $isBilling = $type === 'billing';

        return UserAddress::updateOrCreate(
            [
                'user_id' => $user->id,
                'is_billing' => $isBilling,
                'is_default' => true,
            ],
            [
                'label' => $isBilling ? 'Billing Address' : 'Shipping Address',
                'first_name' => $addressData['first_name'] ?? '',
                'last_name' => $addressData['last_name'] ?? '',
                'phone' => $addressData['phone'] ?? null,
                'address_line_1' => $addressData['address_line_1'] ?? '',
                'address_line_2' => $addressData['address_line_2'] ?? null,
                'city_name' => $addressData['city'] ?? '',
                'region_name' => $addressData['state'] ?? null,
                'postal_code' => $addressData['postal_code'] ?? null,
                'country_id' => $addressData['country_id'] ?? null,
            ]
        );
    }

    /**
     * Process the checkout and create order
     */
    public function processCheckout(
        Cart $cart,
        array $billingData,
        array $shippingData,
        ?string $paymentMethod = null,
        ?string $notes = null
    ): Order {
        return DB::transaction(function () use ($cart, $billingData, $shippingData, $paymentMethod, $notes) {
            // Get or create user
            $user = Auth::user();
            if (!$user) {
                // Quick Checkout - create user
                $user = $this->createQuickCheckoutUser(
                    $billingData['email'],
                    $billingData['phone'] ?? null,
                    $billingData['first_name'],
                    $billingData['last_name']
                );

                // Log them in
                Auth::login($user);

                // Transfer cart to user
                $cart->update(['user_id' => $user->id, 'session_id' => null]);
            }

            // Create addresses
            $billingAddress = $this->createOrUpdateAddress($user, $billingData, 'billing');
            $shippingAddress = ($shippingData['same_as_billing'] ?? true)
                ? $billingAddress
                : $this->createOrUpdateAddress($user, $shippingData, 'shipping');

            // Create order
            $order = $this->createOrder($user, $cart, $billingAddress, $shippingAddress, $notes);

            // Create order items
            $this->createOrderItems($order, $cart);

            // Clear cart after order
            $this->cartService->clearCart($cart);

            return $order->fresh(['items', 'user', 'shippingAddress', 'billingAddress']);
        });
    }

    /**
     * Create the order record
     */
    protected function createOrder(
        User $user,
        Cart $cart,
        UserAddress $billingAddress,
        UserAddress $shippingAddress,
        ?string $notes = null
    ): Order {
        $cartTotals = $this->cartService->calculateTotals($cart);

        // Get default currency (MWK)
        $currency = Currency::where('code', 'MWK')->first();

        return Order::create([
            'user_id' => $user->id,
            'order_number' => $this->orderService->generateOrderNumber(),
            'status' => 'pending',
            'currency_id' => $currency?->id,
            'subtotal' => $cartTotals['subtotal'],
            'discount_amount' => 0,
            'shipping_amount' => $cartTotals['shipping'],
            'tax_amount' => $cartTotals['tax'],
            'total' => $cartTotals['total'],
            'billing_address_id' => $billingAddress->id,
            'shipping_address_id' => $shippingAddress->id,
            'notes' => $notes,
        ]);
    }

    /**
     * Create order items from cart items
     */
    protected function createOrderItems(Order $order, Cart $cart): void
    {
        $cart->load(['items.product.seller', 'items.product.images', 'items.variant']);

        // Get default currency
        $currency = Currency::where('code', 'MWK')->first();

        foreach ($cart->items as $cartItem) {
            $product = $cartItem->product;
            $variant = $cartItem->variant;

            // Get pricing breakdown
            $basePrice = $product->base_price;
            $displayPrice = $this->priceService->getDisplayPrice($product);
            $markupAmount = $displayPrice - $basePrice;

            // Handle variant pricing if applicable
            if ($variant) {
                $basePrice = $variant->price ?? $product->base_price;
                $variantPriceData = $this->priceService->getVariantPrice($variant);
                $displayPrice = $variantPriceData['amount'];
                $markupAmount = $displayPrice - $basePrice;
            }

            $lineTotal = $displayPrice * $cartItem->quantity;

            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'variant_id' => $variant?->id,
                'seller_id' => $product->seller_id,
                'product_name' => $product->name,
                'product_sku' => $product->sku,
                'variant_name' => $variant?->name,
                'product_image' => $product->primary_image_url,
                'quantity' => $cartItem->quantity,
                'base_price' => $basePrice,
                'markup_amount' => $markupAmount,
                'display_price' => $displayPrice,
                'line_total' => $lineTotal,
                'currency_id' => $currency?->id ?? 1,
                'seller_currency_id' => $product->currency_id ?? $currency?->id ?? 1,
                'exchange_rate_used' => 1,
                'status' => 'pending',
            ]);
        }

        // Update order totals based on items (recalculate to be accurate)
        $order->update([
            'subtotal' => $order->items()->sum('line_total'),
            'total' => $order->items()->sum('line_total') + $order->shipping_amount + $order->tax_amount - $order->discount_amount,
        ]);
    }

    /**
     * Get grouped items by seller for fulfillment display
     */
    public function getItemsGroupedBySeller(Order $order): array
    {
        $order->load(['items.seller', 'items.product']);

        $grouped = [];
        foreach ($order->items as $item) {
            $sellerId = $item->seller_id;
            if (!isset($grouped[$sellerId])) {
                $grouped[$sellerId] = [
                    'seller' => $item->seller,
                    'items' => [],
                    'subtotal' => 0,
                ];
            }
            $grouped[$sellerId]['items'][] = $item;
            $grouped[$sellerId]['subtotal'] += $item->line_total;
        }

        return array_values($grouped);
    }
}
