<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Seller;
use App\Models\SellerKyc;
use App\Models\Currency;
use App\Models\Country;
use Illuminate\Database\Seeder;

class SellerSeeder extends Seeder
{
    public function run(): void
    {
        // Get the seller test user
        $sellerUser = User::where('email', 'seller@avelabo.com')->first();
        $mwkCurrency = Currency::where('code', 'MWK')->first();
        $zarCurrency = Currency::where('code', 'ZAR')->first();
        $defaultCountry = Country::where('code', 'MWI')->first();
        $saCountry = Country::where('code', 'ZAF')->first();

        if (!$sellerUser || !$mwkCurrency || !$defaultCountry) {
            return;
        }

        // Create an active (approved) seller
        $seller = Seller::updateOrCreate(
            ['user_id' => $sellerUser->id],
            [
                'shop_name' => 'Test Shop',
                'description' => 'A test shop for development purposes',
                'slug' => 'test-shop',
                'business_type' => 'individual',
                'default_currency_id' => $mwkCurrency->id,
                'country_id' => $defaultCountry->id,
                'status' => 'active',
                'is_verified' => true,
                'approved_at' => now(),
            ]
        );

        // Create approved KYC
        SellerKyc::updateOrCreate(
            ['seller_id' => $seller->id],
            [
                'document_type' => 'national_id',
                'id_front_path' => 'kyc/test/id_front.jpg',
                'id_back_path' => 'kyc/test/id_back.jpg',
                'selfie_path' => 'kyc/test/selfie.jpg',
                'status' => 'approved',
                'submitted_at' => now()->subDays(5),
                'reviewed_at' => now()->subDays(3),
            ]
        );

        // Create a pending seller for testing KYC flow
        $pendingUser = User::firstOrCreate(
            ['email' => 'pending@avelabo.com'],
            [
                'name' => 'Pending Seller',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
                'status' => 'active',
            ]
        );

        $pendingSeller = Seller::firstOrCreate(
            ['user_id' => $pendingUser->id],
            [
                'shop_name' => 'Pending Shop',
                'description' => 'A shop waiting for KYC approval',
                'slug' => 'pending-shop',
                'business_type' => 'individual',
                'default_currency_id' => $mwkCurrency->id,
                'country_id' => $defaultCountry->id,
                'status' => 'pending',
            ]
        );

        // Create pending KYC for review
        SellerKyc::firstOrCreate(
            ['seller_id' => $pendingSeller->id],
            [
                'document_type' => 'national_id',
                'id_front_path' => 'kyc/pending/id_front.jpg',
                'id_back_path' => 'kyc/pending/id_back.jpg',
                'selfie_path' => 'kyc/pending/selfie.jpg',
                'status' => 'pending',
                'submitted_at' => now(),
            ]
        );

        // Create system sellers for scraped products
        $this->createScrapedProductSellers($zarCurrency, $saCountry, $mwkCurrency, $defaultCountry);
    }

    /**
     * Create system-managed sellers for scraped products
     */
    protected function createScrapedProductSellers($zarCurrency, $saCountry, $mwkCurrency, $defaultCountry): void
    {
        // Create Takealot system user
        $takealotUser = User::firstOrCreate(
            ['email' => 'takealot@system.avelabo.com'],
            [
                'name' => 'Takealot System',
                'password' => bcrypt(str()->random(32)),
                'email_verified_at' => now(),
                'status' => 'active',
            ]
        );

        // Create Takealot seller
        Seller::firstOrCreate(
            ['slug' => 'takealot'],
            [
                'user_id' => $takealotUser->id,
                'shop_name' => 'Takealot',
                'description' => 'Products scraped from Takealot.com - South Africa\'s leading online retailer',
                'business_type' => 'company',
                'default_currency_id' => $zarCurrency?->id ?? $mwkCurrency->id,
                'country_id' => $saCountry?->id ?? $defaultCountry->id,
                'status' => 'active',
                'is_verified' => true,
                'approved_at' => now(),
            ]
        );

        // Create Noon system user
        $noonUser = User::firstOrCreate(
            ['email' => 'noon@system.avelabo.com'],
            [
                'name' => 'Noon System',
                'password' => bcrypt(str()->random(32)),
                'email_verified_at' => now(),
                'status' => 'active',
            ]
        );

        // Create Noon seller (uses USD)
        $usdCurrency = Currency::where('code', 'USD')->first();
        Seller::firstOrCreate(
            ['slug' => 'noon'],
            [
                'user_id' => $noonUser->id,
                'shop_name' => 'Noon',
                'description' => 'Products scraped from Noon.com - Middle East\'s leading online retailer',
                'business_type' => 'company',
                'default_currency_id' => $usdCurrency?->id ?? $mwkCurrency->id,
                'country_id' => $defaultCountry->id,
                'status' => 'active',
                'is_verified' => true,
                'approved_at' => now(),
            ]
        );
    }
}
