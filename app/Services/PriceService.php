<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Seller;
use App\Models\Currency;
use Illuminate\Support\Facades\Auth;

/**
 * CRITICAL SERVICE: Combined Pricing Service
 *
 * This service combines markup and currency conversion to provide
 * the final customer-facing price in their preferred currency.
 *
 * Price Calculation Flow:
 * 1. Get base price from product (source cost)
 * 2. Apply seller markup (via MarkupService)
 * 3. Convert to customer's preferred currency (via CurrencyService)
 * 4. Return formatted price
 *
 * IMPORTANT: Customers never see base_price or markup - only the final price!
 */
class PriceService
{
    public function __construct(
        protected CurrencyService $currencyService,
        protected MarkupService $markupService
    ) {}

    /**
     * Get the final price for a product in the given currency
     * This is the main method used for displaying prices to customers
     */
    public function getPrice(Product $product, ?string $currencyCode = null): array
    {
        $finalPrice = $this->markupService->getFinalPrice($product);
        $productCurrency = $product->currency?->code ?? 'MWK';
        $targetCurrency = $currencyCode ?? $this->getCustomerCurrency();

        // Convert to target currency if different
        $convertedPrice = $this->currencyService->convert(
            $finalPrice,
            $productCurrency,
            $targetCurrency
        );

        return [
            'amount' => $convertedPrice,
            'currency' => $targetCurrency,
            'formatted' => $this->currencyService->format($convertedPrice, $targetCurrency),
            'original_amount' => $finalPrice,
            'original_currency' => $productCurrency,
        ];
    }

    /**
     * Get compare-at price (for showing discounts)
     */
    public function getCompareAtPrice(Product $product, ?string $currencyCode = null): ?array
    {
        if (!$product->compare_at_price || $product->compare_at_price <= $product->base_price) {
            return null;
        }

        $productCurrency = $product->currency?->code ?? 'MWK';
        $targetCurrency = $currencyCode ?? $this->getCustomerCurrency();

        // Apply same markup ratio to compare_at_price
        $markupRatio = $this->markupService->getFinalPrice($product) / $product->base_price;
        $compareAtWithMarkup = round($product->compare_at_price * $markupRatio, 2);

        $convertedPrice = $this->currencyService->convert(
            $compareAtWithMarkup,
            $productCurrency,
            $targetCurrency
        );

        return [
            'amount' => $convertedPrice,
            'currency' => $targetCurrency,
            'formatted' => $this->currencyService->format($convertedPrice, $targetCurrency),
        ];
    }

    /**
     * Get variant price with markup and currency conversion
     */
    public function getVariantPrice(ProductVariant $variant, ?string $currencyCode = null): array
    {
        $product = $variant->product;
        $productCurrency = $product->currency?->code ?? 'MWK';
        $targetCurrency = $currencyCode ?? $this->getCustomerCurrency();

        // Calculate markup ratio from the main product
        $basePrice = $product->base_price;
        $finalPrice = $this->markupService->getFinalPrice($product);
        $markupRatio = $basePrice > 0 ? $finalPrice / $basePrice : 1;

        // Apply same ratio to variant price
        $variantFinalPrice = round($variant->price * $markupRatio, 2);

        $convertedPrice = $this->currencyService->convert(
            $variantFinalPrice,
            $productCurrency,
            $targetCurrency
        );

        return [
            'amount' => $convertedPrice,
            'currency' => $targetCurrency,
            'formatted' => $this->currencyService->format($convertedPrice, $targetCurrency),
        ];
    }

    /**
     * Calculate discount percentage between current and compare-at price
     */
    public function getDiscountPercentage(Product $product): ?int
    {
        $compareAt = $this->getCompareAtPrice($product);
        $current = $this->getPrice($product);

        if (!$compareAt || $compareAt['amount'] <= $current['amount']) {
            return null;
        }

        return (int) round(
            (($compareAt['amount'] - $current['amount']) / $compareAt['amount']) * 100
        );
    }

    /**
     * Get prices for multiple products (optimized for listings)
     */
    public function bulkGetPrices(array $products, ?string $currencyCode = null): array
    {
        $prices = [];

        foreach ($products as $product) {
            $prices[$product->id] = [
                'price' => $this->getPrice($product, $currencyCode),
                'compare_at_price' => $this->getCompareAtPrice($product, $currencyCode),
                'discount_percentage' => $this->getDiscountPercentage($product),
            ];
        }

        return $prices;
    }

    /**
     * Calculate cart item total
     */
    public function calculateCartItemTotal(
        Product $product,
        int $quantity,
        ?ProductVariant $variant = null,
        ?string $currencyCode = null
    ): array {
        $unitPrice = $variant
            ? $this->getVariantPrice($variant, $currencyCode)
            : $this->getPrice($product, $currencyCode);

        $total = round($unitPrice['amount'] * $quantity, 2);

        return [
            'unit_price' => $unitPrice,
            'quantity' => $quantity,
            'total' => [
                'amount' => $total,
                'currency' => $unitPrice['currency'],
                'formatted' => $this->currencyService->format($total, $unitPrice['currency']),
            ],
        ];
    }

    /**
     * Get customer's preferred currency
     */
    protected function getCustomerCurrency(): string
    {
        $user = Auth::user();

        if ($user && $user->preferredCurrency) {
            return $user->preferredCurrency->code;
        }

        // Default to MWK (Malawian Kwacha)
        return session('currency', 'MWK');
    }

    /**
     * Set the customer's session currency
     */
    public function setCustomerCurrency(string $currencyCode): void
    {
        $currency = $this->currencyService->getCurrency($currencyCode);

        if ($currency) {
            session(['currency' => $currencyCode]);

            // Update user preference if logged in
            $user = Auth::user();
            if ($user) {
                $user->update(['preferred_currency_id' => $currency->id]);
            }
        }
    }

    /**
     * Get all available currencies for customer selection
     */
    public function getAvailableCurrencies(): array
    {
        return $this->currencyService->getActiveCurrencies();
    }

    /**
     * Format a price amount in the given currency
     */
    public function format(float $amount, ?string $currencyCode = null): string
    {
        $currency = $currencyCode ?? $this->getCustomerCurrency();
        return $this->currencyService->format($amount, $currency);
    }

    /**
     * Get display price (base price + markup) - simple float for model attribute
     */
    public function getDisplayPrice(Product $product): float
    {
        return $this->markupService->getFinalPrice($product);
    }

    /**
     * Get display compare price (compare_at_price + markup) - simple float for model attribute
     */
    public function getDisplayComparePrice(Product $product): ?float
    {
        if (!$product->compare_at_price) {
            return null;
        }

        $basePrice = $product->base_price;
        if ($basePrice <= 0) {
            return $product->compare_at_price;
        }

        $finalPrice = $this->markupService->getFinalPrice($product);
        $markupRatio = $finalPrice / $basePrice;

        return round($product->compare_at_price * $markupRatio, 2);
    }
}
