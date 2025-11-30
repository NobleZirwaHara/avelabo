<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Seller\SellerRegistrationController;
use App\Http\Controllers\Seller\DashboardController as SellerDashboardController;
use App\Http\Controllers\Seller\ProductController as SellerProductController;
use App\Http\Controllers\Seller\OrderController as SellerOrderController;
use App\Http\Controllers\Admin\KycController;
use App\Http\Controllers\Admin\SellerController as AdminSellerController;
use App\Http\Controllers\Admin\MarkupTemplateController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Frontend\HomeController;
use App\Http\Controllers\Frontend\ShopController;
use App\Http\Controllers\Frontend\CartController;
use App\Http\Controllers\Frontend\CheckoutController;
use App\Http\Controllers\Frontend\PaymentController;
use App\Http\Controllers\Frontend\OrderController as CustomerOrderController;
use App\Http\Controllers\Frontend\AccountController;
use App\Http\Controllers\Frontend\VendorController;
use App\Http\Controllers\Frontend\PageController;
use App\Http\Controllers\Frontend\ContactController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\PageContentController;
use App\Http\Controllers\Admin\ContactMessageController;
use App\Http\Controllers\Admin\ScrapingController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Frontend Routes (Public)
|--------------------------------------------------------------------------
*/

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::get('/shop', [ShopController::class, 'index'])->name('shop');
Route::get('/product/{slug}', [ShopController::class, 'show'])->name('product.detail');

/*
|--------------------------------------------------------------------------
| Cart Routes (Public - works with session for guests)
|--------------------------------------------------------------------------
*/
Route::prefix('cart')->group(function () {
    Route::get('/', [CartController::class, 'index'])->name('cart');
    Route::post('/add', [CartController::class, 'add'])->name('cart.add');
    Route::patch('/{cartItem}', [CartController::class, 'update'])->name('cart.update');
    Route::delete('/{cartItem}', [CartController::class, 'remove'])->name('cart.remove');
    Route::delete('/', [CartController::class, 'clear'])->name('cart.clear');
    Route::get('/count', [CartController::class, 'count'])->name('cart.count');
    Route::get('/data', [CartController::class, 'getCart'])->name('cart.data');
});

Route::get('/wishlist', function () {
    return Inertia::render('Frontend/Wishlist');
})->name('wishlist');

Route::get('/compare', function () {
    return Inertia::render('Frontend/Compare');
})->name('compare');

Route::get('/about', function () {
    return Inertia::render('Frontend/About');
})->name('about');

Route::get('/contact', [ContactController::class, 'index'])->name('contact');
Route::post('/contact', [ContactController::class, 'store'])->name('contact.store');

Route::get('/blog', function () {
    return Inertia::render('Frontend/Blog');
})->name('blog');

Route::get('/vendors', [VendorController::class, 'index'])->name('vendors');
Route::get('/vendor/{slug}', [VendorController::class, 'show'])->name('vendor.details');

Route::get('/vendor-guide', [PageController::class, 'vendorGuide'])->name('vendor.guide');
Route::get('/privacy-policy', [PageController::class, 'privacyPolicy'])->name('privacy.policy');
Route::get('/purchase-guide', [PageController::class, 'purchaseGuide'])->name('purchase.guide');

/*
|--------------------------------------------------------------------------
| Authentication Routes (Guest)
|--------------------------------------------------------------------------
*/

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::get('/register', [RegisteredUserController::class, 'create'])->name('register');
    Route::get('/forgot-password', [PasswordResetLinkController::class, 'create'])->name('password.request');
    Route::get('/reset-password/{token}', [NewPasswordController::class, 'create'])->name('password.reset');
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
    Route::get('/verify-email', EmailVerificationPromptController::class)->name('verification.notice');
});

/*
|--------------------------------------------------------------------------
| Customer Routes (Authenticated)
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Checkout Routes (Guests allowed with Quick Checkout)
|--------------------------------------------------------------------------
*/
Route::get('/checkout', [CheckoutController::class, 'show'])->name('checkout');
Route::post('/checkout', [CheckoutController::class, 'process'])->name('checkout.process');
Route::get('/checkout/success', [CheckoutController::class, 'success'])->name('checkout.success');
Route::get('/checkout/cancel', [CheckoutController::class, 'cancel'])->name('checkout.cancel');

/*
|--------------------------------------------------------------------------
| Payment Routes
|--------------------------------------------------------------------------
*/
Route::prefix('payment')->group(function () {
    Route::post('/initiate/{order}', [PaymentController::class, 'initiate'])->name('payment.initiate');
    Route::get('/callback', [PaymentController::class, 'callback'])->name('payment.callback');
    Route::post('/webhook/{gateway}', [PaymentController::class, 'webhook'])->name('payment.webhook')->withoutMiddleware(['web', 'csrf']);
    Route::get('/verify/{reference}', [PaymentController::class, 'verify'])->name('payment.verify');
    Route::get('/cancel', [PaymentController::class, 'cancel'])->name('payment.cancel');
});

/*
|--------------------------------------------------------------------------
| Customer Account Routes (Authenticated)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->prefix('account')->name('account.')->group(function () {
    Route::get('/', [AccountController::class, 'index'])->name('index');
    Route::put('/profile', [AccountController::class, 'updateProfile'])->name('profile.update');
    Route::put('/password', [AccountController::class, 'updatePassword'])->name('password.update');
    Route::post('/track-order', [AccountController::class, 'trackOrder'])->name('track-order');

    // Address management
    Route::post('/addresses', [AccountController::class, 'storeAddress'])->name('addresses.store');
    Route::put('/addresses/{address}', [AccountController::class, 'updateAddress'])->name('addresses.update');
    Route::delete('/addresses/{address}', [AccountController::class, 'destroyAddress'])->name('addresses.destroy');
    Route::post('/addresses/{address}/default', [AccountController::class, 'setDefaultAddress'])->name('addresses.default');
});

// Keep the /account route for backwards compatibility
Route::middleware(['auth', 'verified'])->get('/account', [AccountController::class, 'index'])->name('account');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/invoice/{id?}', function ($id = null) {
        return Inertia::render('Frontend/Invoice', ['id' => $id]);
    })->name('invoice');
});

/*
|--------------------------------------------------------------------------
| Customer Order Routes (Authenticated)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth'])->prefix('customer')->name('customer.')->group(function () {
    Route::get('/orders', [CustomerOrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/{order}', [CustomerOrderController::class, 'show'])->name('orders.show');
    Route::post('/orders/{order}/cancel', [CustomerOrderController::class, 'cancel'])->name('orders.cancel');
});

/*
|--------------------------------------------------------------------------
| Seller Routes
|--------------------------------------------------------------------------
*/

Route::prefix('seller')->name('seller.')->group(function () {
    // Seller Registration (authenticated users who aren't sellers yet)
    Route::middleware('auth')->group(function () {
        Route::get('/register', [SellerRegistrationController::class, 'create'])->name('register');
        Route::post('/register', [SellerRegistrationController::class, 'store'])->name('register.store');
        Route::get('/kyc', [SellerRegistrationController::class, 'showKycForm'])->name('kyc.create');
        Route::post('/kyc', [SellerRegistrationController::class, 'storeKyc'])->name('kyc.store');
        Route::get('/kyc/status', [SellerRegistrationController::class, 'kycStatus'])->name('kyc.status');
    });

    // Protected Seller Routes (approved sellers only)
    Route::middleware(['auth', 'seller'])->group(function () {
        // Dashboard
        Route::get('/', [SellerDashboardController::class, 'index'])->name('dashboard');

        // Products
        Route::resource('products', SellerProductController::class);

        // Orders
        Route::get('/orders', [SellerOrderController::class, 'index'])->name('orders.index');
        Route::get('/orders/{order}', [SellerOrderController::class, 'show'])->name('orders.show');
        Route::patch('/orders/{order}/status', [SellerOrderController::class, 'updateStatus'])->name('orders.update-status');
        Route::post('/orders/{order}/bulk-status', [SellerOrderController::class, 'bulkUpdateStatus'])->name('orders.bulk-update-status');

        // Profile & Settings
        Route::get('/profile', function () {
            return Inertia::render('Seller/Profile');
        })->name('profile');

        Route::get('/settings', function () {
            return Inertia::render('Seller/Settings');
        })->name('settings');
    });
});

/*
|--------------------------------------------------------------------------
| Admin Auth Routes (Guest)
|--------------------------------------------------------------------------
*/

Route::prefix('admin')->name('admin.')->group(function () {
    Route::middleware('guest')->group(function () {
        Route::get('/login', function () {
            return Inertia::render('Admin/Auth/Login');
        })->name('login');

        Route::get('/register', function () {
            return Inertia::render('Admin/Auth/Register');
        })->name('register');

        Route::get('/forgot-password', function () {
            return Inertia::render('Admin/Auth/ForgotPassword');
        })->name('password.request');
    });

    Route::post('/logout', function () {
        auth()->logout();
        request()->session()->invalidate();
        request()->session()->regenerateToken();
        return redirect()->route('admin.login');
    })->name('logout');
});

/*
|--------------------------------------------------------------------------
| Admin Routes (Authenticated & Admin Role)
|--------------------------------------------------------------------------
*/

Route::prefix('admin')->name('admin.')->middleware(['auth', 'admin'])->group(function () {
    // Dashboard
    Route::get('/', function () {
        return Inertia::render('Admin/Dashboard');
    })->name('dashboard');

    // KYC Management
    Route::get('/kyc', [KycController::class, 'index'])->name('kyc.index');
    Route::get('/kyc/{kyc}', [KycController::class, 'show'])->name('kyc.show');
    Route::post('/kyc/{kyc}/approve', [KycController::class, 'approve'])->name('kyc.approve');
    Route::post('/kyc/{kyc}/reject', [KycController::class, 'reject'])->name('kyc.reject');
    Route::post('/kyc/{kyc}/request-documents', [KycController::class, 'requestDocuments'])->name('kyc.request-documents');

    // Sellers
    Route::get('/sellers', [AdminSellerController::class, 'index'])->name('sellers.index');
    Route::get('/sellers/{seller}', [AdminSellerController::class, 'show'])->name('sellers.show');
    Route::put('/sellers/{seller}', [AdminSellerController::class, 'update'])->name('sellers.update');
    Route::patch('/sellers/{seller}/status', [AdminSellerController::class, 'updateStatus'])->name('sellers.update-status');
    Route::post('/sellers/{seller}/apply-markup-template', [AdminSellerController::class, 'applyMarkupTemplate'])->name('sellers.apply-markup-template');
    Route::post('/sellers/{seller}/custom-markup', [AdminSellerController::class, 'setCustomMarkup'])->name('sellers.custom-markup');

    // Markup Templates
    Route::resource('markup-templates', MarkupTemplateController::class);

    // Products
    Route::resource('products', AdminProductController::class);
    Route::post('/products/bulk-status', [AdminProductController::class, 'bulkUpdateStatus'])->name('products.bulk-status');
    Route::post('/products/bulk-delete', [AdminProductController::class, 'bulkDestroy'])->name('products.bulk-delete');
    Route::patch('/products/{product}/stock', [AdminProductController::class, 'updateStock'])->name('products.update-stock');

    // Categories
    Route::resource('categories', AdminCategoryController::class);
    Route::post('/categories/update-order', [AdminCategoryController::class, 'updateOrder'])->name('categories.update-order');
    Route::patch('/categories/{category}/toggle-status', [AdminCategoryController::class, 'toggleStatus'])->name('categories.toggle-status');
    Route::patch('/categories/{category}/toggle-featured', [AdminCategoryController::class, 'toggleFeatured'])->name('categories.toggle-featured');

    // Orders
    Route::get('/orders', [AdminOrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/{order}', [AdminOrderController::class, 'show'])->name('orders.show');
    Route::patch('/orders/{order}/status', [AdminOrderController::class, 'updateStatus'])->name('orders.update-status');
    Route::post('/orders/{order}/refund', [AdminOrderController::class, 'refund'])->name('orders.refund');

    // Transactions
    Route::get('/transactions', function () {
        return Inertia::render('Admin/Transactions/Index');
    })->name('transactions.index');

    Route::get('/transactions/{id}', function ($id) {
        return Inertia::render('Admin/Transactions/Show', ['id' => $id]);
    })->name('transactions.show');

    // Brands
    Route::get('/brands', function () {
        return Inertia::render('Admin/Brands/Index');
    })->name('brands.index');

    // Reviews
    Route::get('/reviews', function () {
        return Inertia::render('Admin/Reviews/Index');
    })->name('reviews.index');

    Route::get('/reviews/{id}', function ($id) {
        return Inertia::render('Admin/Reviews/Show', ['id' => $id]);
    })->name('reviews.show');

    // Settings
    Route::get('/settings', function () {
        return Inertia::render('Admin/Settings/Index');
    })->name('settings');

    // Page Content Management
    Route::resource('pages', PageContentController::class)->parameters(['pages' => 'page']);

    // Contact Messages
    Route::get('/contact-messages', [ContactMessageController::class, 'index'])->name('contact-messages.index');
    Route::get('/contact-messages/{contactMessage}', [ContactMessageController::class, 'show'])->name('contact-messages.show');
    Route::put('/contact-messages/{contactMessage}', [ContactMessageController::class, 'update'])->name('contact-messages.update');
    Route::put('/contact-messages/{contactMessage}/mark-replied', [ContactMessageController::class, 'markAsReplied'])->name('contact-messages.mark-replied');
    Route::put('/contact-messages/{contactMessage}/archive', [ContactMessageController::class, 'archive'])->name('contact-messages.archive');
    Route::delete('/contact-messages/{contactMessage}', [ContactMessageController::class, 'destroy'])->name('contact-messages.destroy');
    Route::post('/contact-messages/bulk-action', [ContactMessageController::class, 'bulkAction'])->name('contact-messages.bulk-action');

    // Scraping Management
    Route::prefix('scraping')->name('scraping.')->group(function () {
        Route::get('/', [ScrapingController::class, 'index'])->name('index');
        Route::get('/create', [ScrapingController::class, 'create'])->name('create');
        Route::post('/', [ScrapingController::class, 'store'])->name('store');
        Route::get('/sources/{source}', [ScrapingController::class, 'show'])->name('show');
        Route::put('/sources/{source}', [ScrapingController::class, 'update'])->name('update');
        Route::delete('/sources/{source}', [ScrapingController::class, 'destroy'])->name('destroy');
        Route::post('/sources/{source}/toggle-active', [ScrapingController::class, 'toggleActive'])->name('toggle-active');
        Route::post('/sources/{source}/start-job', [ScrapingController::class, 'startJob'])->name('start-job');
        Route::get('/jobs/{job}', [ScrapingController::class, 'showJob'])->name('job');
        Route::post('/jobs/{job}/cancel', [ScrapingController::class, 'cancelJob'])->name('cancel-job');
    });
});
