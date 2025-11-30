<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            // Geographic data (order matters)
            CountrySeeder::class,
            RegionSeeder::class,
            CitySeeder::class,

            // Currency data
            CurrencySeeder::class,

            // Role & Permission data
            RolePermissionSeeder::class,

            // Create admin and test users
            AdminUserSeeder::class,

            // Catalog data
            CategorySeeder::class,
            AttributeSeeder::class,

            // Payment gateways
            PaymentGatewaySeeder::class,

            // Application settings
            SettingSeeder::class,

            // Test sellers
            SellerSeeder::class,

            // Scraping sources
            ScrapingSourceSeeder::class,

            // Test products
            ProductSeeder::class,
        ]);
    }
}
