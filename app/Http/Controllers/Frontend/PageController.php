<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\PageContent;
use App\Models\Product;
use Inertia\Inertia;

class PageController extends Controller
{
    /**
     * Display the vendor guide page
     */
    public function vendorGuide()
    {
        $page = PageContent::getBySlug('vendor-guide');

        $content = $page?->content ?? $this->getDefaultVendorGuideContent();

        return Inertia::render('Frontend/VendorGuide', [
            'pageContent' => [
                'title' => $page?->title ?? 'Become a Seller',
                'meta_title' => $page?->meta_title,
                'meta_description' => $page?->meta_description,
                'content' => $content,
            ],
        ]);
    }

    /**
     * Display the purchase guide page
     */
    public function purchaseGuide()
    {
        $page = PageContent::getBySlug('purchase-guide');

        $content = $page?->content ?? $this->getDefaultPurchaseGuideContent();

        // Get sidebar categories
        $categories = Category::withCount(['products' => fn($q) => $q->active()->inStock()])
            ->whereNull('parent_id')
            ->active()
            ->ordered()
            ->take(5)
            ->get()
            ->map(fn($cat) => [
                'id' => $cat->id,
                'name' => $cat->name,
                'slug' => $cat->slug,
                'icon' => $cat->icon,
                'products_count' => $cat->products_count,
            ]);

        // Trending products for sidebar
        $trendingProducts = Product::with(['images'])
            ->active()
            ->inStock()
            ->orderBy('views_count', 'desc')
            ->take(4)
            ->get()
            ->map(fn($product) => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'price' => $product->display_price,
                'image' => $product->primary_image_url,
                'rating' => $product->rating ?? 0,
            ]);

        return Inertia::render('Frontend/PurchaseGuide', [
            'pageContent' => [
                'title' => $page?->title ?? 'Purchase Guide',
                'meta_title' => $page?->meta_title,
                'meta_description' => $page?->meta_description,
                'content' => $content,
            ],
            'categories' => $categories,
            'trendingProducts' => $trendingProducts,
        ]);
    }

    /**
     * Display the privacy policy page
     */
    public function privacyPolicy()
    {
        $page = PageContent::getBySlug('privacy-policy');

        $content = $page?->content ?? $this->getDefaultPrivacyPolicyContent();

        // Get sidebar categories
        $categories = Category::withCount(['products' => fn($q) => $q->active()->inStock()])
            ->whereNull('parent_id')
            ->active()
            ->ordered()
            ->take(5)
            ->get()
            ->map(fn($cat) => [
                'id' => $cat->id,
                'name' => $cat->name,
                'slug' => $cat->slug,
                'icon' => $cat->icon,
                'products_count' => $cat->products_count,
            ]);

        return Inertia::render('Frontend/PrivacyPolicy', [
            'pageContent' => [
                'title' => $page?->title ?? 'Privacy Policy',
                'meta_title' => $page?->meta_title,
                'meta_description' => $page?->meta_description,
                'content' => $content,
            ],
            'categories' => $categories,
        ]);
    }

    /**
     * Default vendor guide content
     */
    protected function getDefaultVendorGuideContent(): array
    {
        return [
            'hero' => [
                'title' => 'Start selling on Avelabo today',
                'subtitle' => 'Join our marketplace and reach thousands of customers across Malawi. We handle payments, you handle the products.',
            ],
            'features' => [
                [
                    'icon' => 'icon-1.svg',
                    'title' => 'Low Commission Rates',
                    'description' => 'Keep more of your profits with our competitive commission structure designed for local sellers.',
                ],
                [
                    'icon' => 'icon-2.svg',
                    'title' => 'Wide Customer Base',
                    'description' => 'Access thousands of customers across Malawi looking for quality products.',
                ],
                [
                    'icon' => 'icon-3.svg',
                    'title' => 'Secure Payments',
                    'description' => 'Receive payments directly to your mobile money or bank account with our secure payment system.',
                ],
            ],
            'steps' => [
                [
                    'title' => '1. Register Your Account',
                    'content' => 'Create your seller account by providing your business details, contact information, and identification documents for verification.',
                    'items' => ['Business name and type', 'Contact information', 'ID verification', 'Bank or mobile money details'],
                ],
                [
                    'title' => '2. Complete KYC Verification',
                    'content' => 'Submit your KYC documents for review. Our team will verify your information within 24-48 hours.',
                ],
                [
                    'title' => '3. Add Your Products',
                    'content' => 'Once approved, start adding your products with clear photos, descriptions, and competitive pricing.',
                ],
                [
                    'title' => '4. Start Selling',
                    'content' => 'Your products will be visible to customers. Manage orders, track sales, and grow your business from your seller dashboard.',
                ],
                [
                    'title' => '5. Receive Payments',
                    'content' => 'Get paid directly to your preferred payment method. We support mobile money (Airtel Money, TNM Mpamba) and bank transfers.',
                ],
            ],
        ];
    }

    /**
     * Default purchase guide content
     */
    protected function getDefaultPurchaseGuideContent(): array
    {
        return [
            'sections' => [
                [
                    'title' => '1. Create Your Account',
                    'content' => 'Register for a free account to start shopping. You can also checkout as a guest for quick purchases.',
                    'items' => ['Name and email address', 'Phone number for delivery updates', 'Delivery address'],
                ],
                [
                    'title' => '2. Browse & Select Products',
                    'content' => 'Explore our wide range of products from trusted sellers. Use filters to find exactly what you need.',
                ],
                [
                    'title' => '3. Add to Cart & Checkout',
                    'content' => 'Add items to your cart and proceed to checkout when ready. Review your order before payment.',
                ],
                [
                    'title' => '4. Make Payment',
                    'content' => 'Pay securely using your preferred method. We accept mobile money and card payments.',
                    'items' => ['Airtel Money', 'TNM Mpamba', 'Visa/Mastercard'],
                ],
                [
                    'title' => '5. Track Your Order',
                    'content' => 'Track your order status from your account dashboard. You\'ll receive SMS updates at each stage.',
                ],
                [
                    'title' => '6. Receive Your Delivery',
                    'content' => 'Your order will be delivered to your specified address. Inspect before accepting delivery.',
                ],
            ],
        ];
    }

    /**
     * Default privacy policy content
     */
    protected function getDefaultPrivacyPolicyContent(): array
    {
        return [
            'last_updated' => now()->format('F j, Y'),
            'sections' => [
                [
                    'title' => 'Introduction',
                    'content' => 'Welcome to Avelabo. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase.',
                ],
                [
                    'title' => 'Information We Collect',
                    'content' => 'We collect personal information that you voluntarily provide to us when you register, make a purchase, or contact us.',
                    'items' => [
                        'Personal identification (name, email, phone)',
                        'Payment information (processed securely by our payment partners)',
                        'Delivery addresses',
                        'Order history and preferences',
                    ],
                ],
                [
                    'title' => 'How We Use Your Information',
                    'content' => 'We use the information we collect to:',
                    'items' => [
                        'Process and fulfill your orders',
                        'Send order confirmations and updates',
                        'Respond to your inquiries and provide customer support',
                        'Improve our website and services',
                        'Send promotional communications (with your consent)',
                    ],
                ],
                [
                    'title' => 'Information Sharing',
                    'content' => 'We share your information only with trusted third parties who assist us in operating our website, conducting our business, or servicing you.',
                    'items' => [
                        'Sellers (to fulfill your orders)',
                        'Payment processors (to process transactions)',
                        'Delivery partners (to deliver your orders)',
                    ],
                ],
                [
                    'title' => 'Data Security',
                    'content' => 'We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.',
                ],
                [
                    'title' => 'Your Rights',
                    'content' => 'You have the right to access, update, or delete your personal information. Contact us at privacy@avelabo.com for any requests.',
                ],
                [
                    'title' => 'Contact Us',
                    'content' => 'If you have questions about this Privacy Policy, please contact us at privacy@avelabo.com or through our contact page.',
                ],
            ],
        ];
    }
}
