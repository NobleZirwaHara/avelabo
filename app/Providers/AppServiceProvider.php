<?php

namespace App\Providers;

use App\Services\Scraping\ScrapingService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register ScrapingService as a singleton
        $this->app->singleton(ScrapingService::class, function ($app) {
            return new ScrapingService();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
