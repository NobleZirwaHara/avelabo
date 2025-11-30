<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Services\CartService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CartController extends Controller
{
    public function __construct(
        protected CartService $cartService
    ) {}

    /**
     * Display the cart page
     */
    public function index()
    {
        $cart = $this->cartService->getOrCreateCart();
        $cartData = $this->cartService->calculateTotals($cart);

        return Inertia::render('Frontend/Cart', [
            'cart' => $cartData,
        ]);
    }

    /**
     * Add item to cart
     */
    public function add(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'integer|min:1|max:100',
            'variant_id' => 'nullable|exists:product_variants,id',
        ]);

        try {
            $cart = $this->cartService->getOrCreateCart();
            $this->cartService->addProduct(
                $cart,
                $validated['product_id'],
                $validated['quantity'] ?? 1,
                $validated['variant_id'] ?? null
            );

            $cartData = $this->cartService->calculateTotals($cart->fresh());

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Product added to cart',
                    'cart' => $cartData,
                ]);
            }

            return back()->with('success', 'Product added to cart');
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                ], 422);
            }

            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Update cart item quantity
     */
    public function update(Request $request, CartItem $cartItem)
    {
        // Verify the cart item belongs to current user's cart
        $cart = $this->cartService->getOrCreateCart();
        if ($cartItem->cart_id !== $cart->id) {
            abort(403);
        }

        $validated = $request->validate([
            'quantity' => 'required|integer|min:0|max:100',
        ]);

        try {
            if ($validated['quantity'] === 0) {
                $this->cartService->removeItem($cartItem);
                $message = 'Item removed from cart';
            } else {
                $this->cartService->updateQuantity($cartItem, $validated['quantity']);
                $message = 'Cart updated';
            }

            $cartData = $this->cartService->calculateTotals($cart->fresh());

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => $message,
                    'cart' => $cartData,
                ]);
            }

            return back()->with('success', $message);
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                ], 422);
            }

            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Remove item from cart
     */
    public function remove(Request $request, CartItem $cartItem)
    {
        // Verify the cart item belongs to current user's cart
        $cart = $this->cartService->getOrCreateCart();
        if ($cartItem->cart_id !== $cart->id) {
            abort(403);
        }

        $this->cartService->removeItem($cartItem);
        $cartData = $this->cartService->calculateTotals($cart->fresh());

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Item removed from cart',
                'cart' => $cartData,
            ]);
        }

        return back()->with('success', 'Item removed from cart');
    }

    /**
     * Clear entire cart
     */
    public function clear(Request $request)
    {
        $cart = $this->cartService->getOrCreateCart();
        $this->cartService->clearCart($cart);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Cart cleared',
                'cart' => $this->cartService->calculateTotals($cart->fresh()),
            ]);
        }

        return back()->with('success', 'Cart cleared');
    }

    /**
     * Get cart data (API endpoint)
     */
    public function getCart(Request $request)
    {
        $cart = $this->cartService->getOrCreateCart();
        $cartData = $this->cartService->calculateTotals($cart);

        return response()->json([
            'success' => true,
            'cart' => $cartData,
        ]);
    }

    /**
     * Get cart count for header display
     */
    public function count()
    {
        $cart = $this->cartService->getOrCreateCart();

        return response()->json([
            'count' => $cart->item_count,
            'total' => $cart->total,
        ]);
    }
}
