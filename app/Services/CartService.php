<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CartService
{
    public function __construct(
        protected PriceService $priceService
    ) {}

    /**
     * Get or create a cart for the current user/session
     */
    public function getOrCreateCart(?int $userId = null, ?string $sessionId = null): Cart
    {
        $userId = $userId ?? Auth::id();
        $sessionId = $sessionId ?? session()->getId();

        // Try to find existing cart
        $cart = Cart::active()
            ->when($userId, fn($q) => $q->forUser($userId))
            ->when(!$userId, fn($q) => $q->forSession($sessionId))
            ->first();

        if (!$cart) {
            $cart = Cart::create([
                'user_id' => $userId,
                'session_id' => $sessionId,
                'expires_at' => $userId ? null : now()->addDays(7),
            ]);
        }

        return $cart->load(['items.product.images', 'items.product.seller', 'items.variant']);
    }

    /**
     * Add a product to cart
     */
    public function addProduct(
        Cart $cart,
        int $productId,
        int $quantity = 1,
        ?int $variantId = null
    ): CartItem {
        $product = Product::with('seller')->findOrFail($productId);
        $variant = $variantId ? ProductVariant::findOrFail($variantId) : null;

        // Validate stock
        $this->validateStock($product, $variant, $quantity);

        // Get display price (with markup applied)
        $unitPrice = $variant
            ? $this->priceService->getVariantPrice($variant)['amount']
            : $this->priceService->getDisplayPrice($product);

        // Check if item already exists in cart
        $existingItem = $cart->items()
            ->where('product_id', $productId)
            ->where('product_variant_id', $variantId)
            ->first();

        if ($existingItem) {
            $newQuantity = $existingItem->quantity + $quantity;
            $this->validateStock($product, $variant, $newQuantity);

            $existingItem->update([
                'quantity' => $newQuantity,
                'unit_price' => $unitPrice,
            ]);

            return $existingItem->fresh();
        }

        return $cart->items()->create([
            'product_id' => $productId,
            'product_variant_id' => $variantId,
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
        ]);
    }

    /**
     * Update cart item quantity
     */
    public function updateQuantity(CartItem $cartItem, int $quantity): CartItem
    {
        if ($quantity <= 0) {
            $cartItem->delete();
            throw new \Exception('Item removed from cart');
        }

        $product = $cartItem->product;
        $variant = $cartItem->variant;

        $this->validateStock($product, $variant, $quantity);

        // Update price in case it changed
        $unitPrice = $variant
            ? $this->priceService->getVariantPrice($variant)['amount']
            : $this->priceService->getDisplayPrice($product);

        $cartItem->update([
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
        ]);

        return $cartItem->fresh();
    }

    /**
     * Remove item from cart
     */
    public function removeItem(CartItem $cartItem): bool
    {
        return $cartItem->delete();
    }

    /**
     * Clear entire cart
     */
    public function clearCart(Cart $cart): bool
    {
        return $cart->items()->delete() >= 0;
    }

    /**
     * Merge guest cart with user cart on login
     */
    public function mergeCarts(string $sessionId, int $userId): Cart
    {
        $guestCart = Cart::active()->forSession($sessionId)->first();
        $userCart = $this->getOrCreateCart($userId);

        if (!$guestCart || $guestCart->id === $userCart->id) {
            return $userCart;
        }

        DB::transaction(function () use ($guestCart, $userCart) {
            foreach ($guestCart->items as $guestItem) {
                $existingItem = $userCart->items()
                    ->where('product_id', $guestItem->product_id)
                    ->where('product_variant_id', $guestItem->product_variant_id)
                    ->first();

                if ($existingItem) {
                    // Add quantities together
                    $existingItem->update([
                        'quantity' => $existingItem->quantity + $guestItem->quantity,
                    ]);
                } else {
                    // Move item to user cart
                    $guestItem->update(['cart_id' => $userCart->id]);
                }
            }

            // Delete guest cart
            $guestCart->delete();
        });

        return $userCart->fresh(['items.product.images', 'items.product.seller', 'items.variant']);
    }

    /**
     * Calculate cart totals with display prices
     */
    public function calculateTotals(Cart $cart): array
    {
        $cart->load(['items.product.seller', 'items.variant']);

        $subtotal = 0;
        $itemsData = [];

        foreach ($cart->items as $item) {
            $product = $item->product;
            $variant = $item->variant;

            // Get current display price
            $unitPrice = $variant
                ? $this->priceService->getVariantPrice($variant)['amount']
                : $this->priceService->getDisplayPrice($product);

            $lineTotal = $unitPrice * $item->quantity;
            $subtotal += $lineTotal;

            $itemsData[] = [
                'id' => $item->id,
                'product_id' => $product->id,
                'variant_id' => $variant?->id,
                'name' => $product->name,
                'variant_name' => $variant?->name,
                'image' => $product->primary_image_url,
                'unit_price' => $unitPrice,
                'quantity' => $item->quantity,
                'line_total' => $lineTotal,
                'seller_id' => $product->seller_id,
                'seller_name' => $product->seller?->business_name,
                'in_stock' => $this->isInStock($product, $variant, $item->quantity),
            ];
        }

        // For now, no shipping calculation or tax
        $shipping = 0;
        $tax = 0;
        $total = $subtotal + $shipping + $tax;

        return [
            'items' => $itemsData,
            'item_count' => $cart->items->sum('quantity'),
            'subtotal' => $subtotal,
            'shipping' => $shipping,
            'tax' => $tax,
            'total' => $total,
            'currency' => 'MWK',
        ];
    }

    /**
     * Validate all items in cart are in stock
     */
    public function validateCartStock(Cart $cart): array
    {
        $errors = [];

        foreach ($cart->items as $item) {
            if (!$this->isInStock($item->product, $item->variant, $item->quantity)) {
                $errors[] = [
                    'item_id' => $item->id,
                    'product_name' => $item->product->name,
                    'requested' => $item->quantity,
                    'available' => $this->getAvailableStock($item->product, $item->variant),
                ];
            }
        }

        return $errors;
    }

    /**
     * Validate stock for a product/variant
     */
    protected function validateStock(Product $product, ?ProductVariant $variant, int $quantity): void
    {
        if (!$this->isInStock($product, $variant, $quantity)) {
            $available = $this->getAvailableStock($product, $variant);
            throw new \Exception("Insufficient stock. Only {$available} available.");
        }
    }

    /**
     * Check if product is in stock for requested quantity
     */
    protected function isInStock(Product $product, ?ProductVariant $variant, int $quantity): bool
    {
        if ($variant) {
            if (!$variant->track_inventory) {
                return true;
            }
            return $variant->stock_quantity >= $quantity || $variant->allow_backorders;
        }

        if (!$product->track_inventory) {
            return true;
        }
        return $product->stock_quantity >= $quantity || $product->allow_backorders;
    }

    /**
     * Get available stock quantity
     */
    protected function getAvailableStock(Product $product, ?ProductVariant $variant): int
    {
        if ($variant) {
            return $variant->track_inventory ? $variant->stock_quantity : 999;
        }
        return $product->track_inventory ? $product->stock_quantity : 999;
    }

    /**
     * Get cart for API response
     */
    public function getCartData(?Cart $cart = null): array
    {
        $cart = $cart ?? $this->getOrCreateCart();

        return $this->calculateTotals($cart);
    }

    /**
     * Refresh prices for all cart items (in case prices changed)
     */
    public function refreshPrices(Cart $cart): void
    {
        foreach ($cart->items as $item) {
            $product = $item->product;
            $variant = $item->variant;

            $unitPrice = $variant
                ? $this->priceService->getVariantPrice($variant)['amount']
                : $this->priceService->getDisplayPrice($product);

            if ($item->unit_price != $unitPrice) {
                $item->update(['unit_price' => $unitPrice]);
            }
        }
    }
}
