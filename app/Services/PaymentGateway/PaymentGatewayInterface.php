<?php

namespace App\Services\PaymentGateway;

use App\Models\Order;

interface PaymentGatewayInterface
{
    /**
     * Initialize a payment
     */
    public function initializePayment(Order $order, array $options = []): PaymentResponse;

    /**
     * Process a payment (for direct payments)
     */
    public function processPayment(string $transactionReference, array $data): PaymentResponse;

    /**
     * Verify a payment status
     */
    public function verifyPayment(string $transactionReference): PaymentResponse;

    /**
     * Handle webhook callback
     */
    public function handleWebhook(array $payload): PaymentResponse;

    /**
     * Refund a payment
     */
    public function refundPayment(string $transactionReference, float $amount): PaymentResponse;

    /**
     * Get available payment methods
     */
    public function getAvailablePaymentMethods(): array;
}
