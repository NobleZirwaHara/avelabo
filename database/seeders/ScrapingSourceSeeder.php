<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Currency;
use App\Models\ScrapingSource;
use App\Models\Seller;
use Illuminate\Database\Seeder;

class ScrapingSourceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get currencies
        $zarCurrency = Currency::where('code', 'ZAR')->first();
        $usdCurrency = Currency::where('code', 'USD')->first();

        // Get sellers
        $takealotSeller = Seller::where('slug', 'takealot')->first();
        $noonSeller = Seller::where('slug', 'noon')->first();

        // Get default category
        $defaultCategory = Category::where('slug', 'electronics')->first()
            ?? Category::first();

        if (!$zarCurrency || !$takealotSeller) {
            $this->command->warn('Required data not found. Run SellerSeeder and CurrencySeeder first.');
            return;
        }

        // Create Takealot source
        ScrapingSource::firstOrCreate(
            ['slug' => 'takealot'],
            [
                'name' => 'Takealot',
                'base_url' => 'https://www.takealot.com',
                'seller_id' => $takealotSeller->id,
                'default_currency_id' => $zarCurrency->id,
                'default_category_id' => $defaultCategory?->id,
                'config' => [
                    'max_pages_per_category' => 5,
                    'delay_between_requests' => 2000,
                    'categories' => [
                        'electronics',
                        'computers',
                        'gaming',
                        'cellphones-wearables',
                        'home-kitchen',
                    ],
                ],
                'schedule' => '0 2 * * *', // Daily at 2 AM
                'is_active' => true,
                'auto_publish' => true,
            ]
        );

        // Create Noon source (if seller exists)
        if ($noonSeller && $usdCurrency) {
            ScrapingSource::firstOrCreate(
                ['slug' => 'noon'],
                [
                    'name' => 'Noon',
                    'base_url' => 'https://www.noon.com',
                    'seller_id' => $noonSeller->id,
                    'default_currency_id' => $usdCurrency->id,
                    'default_category_id' => $defaultCategory?->id,
                    'config' => [
                        'max_pages_per_category' => 5,
                        'delay_between_requests' => 2000,
                        'region' => 'uae',
                    ],
                    'schedule' => '0 3 * * *', // Daily at 3 AM
                    'is_active' => false, // Disabled until scraper is implemented
                    'auto_publish' => true,
                ]
            );
        }

        $this->command->info('Scraping sources seeded successfully.');
    }
}
