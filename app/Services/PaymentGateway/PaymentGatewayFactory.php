<?php

namespace App\Services\PaymentGateway;

use App\Models\PaymentGateway;

class PaymentGatewayFactory
{
    public static function create(string $gatewaySlug): PaymentGatewayInterface
    {
        return match ($gatewaySlug) {
            'paychangu' => new PayChanguGateway(),
            'onekhusa' => new OneKhusaGateway(),
            default => throw new \Exception("Payment gateway '{$gatewaySlug}' not supported"),
        };
    }

    public static function createFromId(int $gatewayId): PaymentGatewayInterface
    {
        $gateway = PaymentGateway::findOrFail($gatewayId);
        return self::create($gateway->slug);
    }

    public static function getAvailableGateways(): array
    {
        return PaymentGateway::active()
            ->ordered()
            ->get()
            ->map(fn($g) => [
                'id' => $g->id,
                'slug' => $g->slug,
                'name' => $g->display_name,
                'description' => $g->description,
                'logo' => $g->logo,
            ])
            ->toArray();
    }
}
