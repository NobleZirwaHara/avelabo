<?php

namespace Database\Seeders;

use App\Models\PaymentGateway;
use Illuminate\Database\Seeder;

class PaymentGatewaySeeder extends Seeder
{
    public function run(): void
    {
        $gateways = [
            [
                'name' => 'paychangu',
                'slug' => 'paychangu',
                'display_name' => 'PayChangu',
                'description' => 'Pay using Airtel Money, TNM Mpamba, or Card via PayChangu',
                'is_active' => true,
                'supported_currencies' => ['MWK', 'ZAR', 'USD'],
                'supported_countries' => ['MW', 'ZA', 'US'],
                'is_test_mode' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'onekhusa',
                'slug' => 'onekhusa',
                'display_name' => 'OneKhusa',
                'description' => 'Pay using Airtel Money or TNM Mpamba via OneKhusa',
                'is_active' => true,
                'supported_currencies' => ['MWK'],
                'supported_countries' => ['MW'],
                'is_test_mode' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'cod',
                'slug' => 'cash-on-delivery',
                'display_name' => 'Cash on Delivery',
                'description' => 'Pay cash when your order is delivered',
                'is_active' => true,
                'supported_currencies' => ['MWK'],
                'supported_countries' => ['MW'],
                'is_test_mode' => false,
                'sort_order' => 3,
            ],
        ];

        foreach ($gateways as $gateway) {
            PaymentGateway::updateOrCreate(
                ['slug' => $gateway['slug']],
                $gateway
            );
        }
    }
}
