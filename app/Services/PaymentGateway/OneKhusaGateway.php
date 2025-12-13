<?php

namespace App\Services\PaymentGateway;

use App\Models\Order;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OneKhusaGateway implements PaymentGatewayInterface
{
    private string $apiKey;
    private string $apiSecret;
    private string $baseUrl;
    private ?string $accessToken = null;

    public function __construct()
    {
        $this->apiKey = config('services.onekhusa.api_key');
        $this->apiSecret = config('services.onekhusa.api_secret');
        $this->organizationId = config('services.onekhusa.organization_id');
        $this->merchantAccountNumber = config('services.onekhusa.merchant_account_no');
        $this->baseUrl = config('services.onekhusa.base_url', 'https://api.onekhusa.com');
    }

    public function initializePayment(Order $order, array $options = []): PaymentResponse
    {
        try {
            $this->authenticate();

            $payload = [
                'amount' => $order->total,
                'currency' => 'MWK',
                'reference' => $order->order_number,
                'description' => 'Payment for Order #' . $order->order_number,
                'customer' => [
                    'email' => $order->user->email,
                    'phone' => $order->user->phone ?? $order->billingAddress?->phone,
                    'name' => $order->user->name,
                ],
                'callback_url' => $options['callback_url'] ?? route('payment.webhook', 'onekhusa'),
                'redirect_url' => $options['return_url'] ?? route('checkout.success', ['order' => $order->order_number]),
                'metadata' => [
                    'order_id' => $order->id,
                    'user_id' => $order->user_id,
                ],
            ];

            $response = $this->makeRequest('POST', '/collections/initiate', $payload);

            if (isset($response['success']) && $response['success']) {
                return new PaymentResponse(
                    success: true,
                    message: 'Payment initialized successfully',
                    transactionId: $response['data']['transaction_id'] ?? $order->order_number,
                    redirectUrl: $response['data']['payment_url'] ?? null,
                    data: $response['data'] ?? []
                );
            }

            return new PaymentResponse(
                success: false,
                message: $response['message'] ?? 'Failed to initialize payment',
                errors: $response['errors'] ?? []
            );

        } catch (\Exception $e) {
            Log::error('OneKhusa initialization error: ' . $e->getMessage());

            return new PaymentResponse(
                success: false,
                message: 'Payment initialization failed. Please try again.',
                errors: ['exception' => $e->getMessage()]
            );
        }
    }

    public function processPayment(string $transactionReference, array $data): PaymentResponse
    {
        try {
            $this->authenticate();

            $payload = array_merge([
                'reference' => $transactionReference,
            ], $data);

            $response = $this->makeRequest('POST', '/collections/process', $payload);

            if (isset($response['success']) && $response['success']) {
                return new PaymentResponse(
                    success: true,
                    message: 'Payment processed',
                    transactionId: $response['data']['transaction_id'] ?? $transactionReference,
                    data: $response['data'] ?? []
                );
            }

            return new PaymentResponse(
                success: false,
                message: $response['message'] ?? 'Payment processing failed',
                errors: $response['errors'] ?? []
            );

        } catch (\Exception $e) {
            return new PaymentResponse(
                success: false,
                message: 'Payment processing error',
                errors: ['exception' => $e->getMessage()]
            );
        }
    }

    public function verifyPayment(string $transactionReference): PaymentResponse
    {
        try {
            $this->authenticate();

            $response = $this->makeRequest('GET', "/collections/status/{$transactionReference}");

            if (isset($response['success']) && $response['success']) {
                $status = $response['data']['status'] ?? 'unknown';

                if (in_array($status, ['completed', 'successful', 'paid'])) {
                    return new PaymentResponse(
                        success: true,
                        message: 'Payment verified successfully',
                        transactionId: $transactionReference,
                        data: $response['data'] ?? []
                    );
                }

                return new PaymentResponse(
                    success: false,
                    message: "Payment status: {$status}",
                    data: $response['data'] ?? []
                );
            }

            return new PaymentResponse(
                success: false,
                message: 'Payment verification failed',
                data: $response
            );

        } catch (\Exception $e) {
            return new PaymentResponse(
                success: false,
                message: 'Payment verification error',
                errors: ['exception' => $e->getMessage()]
            );
        }
    }

    public function handleWebhook(array $payload): PaymentResponse
    {
        try {
            // Verify webhook authenticity
            if (!$this->verifyWebhookSignature($payload)) {
                Log::warning('OneKhusa: Invalid webhook signature');
                return new PaymentResponse(
                    success: false,
                    message: 'Invalid webhook signature'
                );
            }

            $reference = $payload['reference'] ?? $payload['transaction_reference'] ?? null;
            $status = $payload['status'] ?? null;

            if (!$reference) {
                return new PaymentResponse(
                    success: false,
                    message: 'No transaction reference in webhook'
                );
            }

            // Check if payment was successful
            if (in_array($status, ['completed', 'successful', 'paid'])) {
                return new PaymentResponse(
                    success: true,
                    message: 'Payment confirmed via webhook',
                    transactionId: $reference,
                    data: $payload
                );
            }

            return new PaymentResponse(
                success: false,
                message: "Payment status: {$status}",
                transactionId: $reference,
                data: $payload
            );

        } catch (\Exception $e) {
            Log::error('OneKhusa webhook error: ' . $e->getMessage());
            return new PaymentResponse(
                success: false,
                message: 'Webhook processing error',
                errors: ['exception' => $e->getMessage()]
            );
        }
    }

    public function refundPayment(string $transactionReference, float $amount): PaymentResponse
    {
        try {
            $this->authenticate();

            $response = $this->makeRequest('POST', '/refunds/initiate', [
                'transaction_reference' => $transactionReference,
                'amount' => $amount,
                'reason' => 'Customer refund request',
            ]);

            if (isset($response['success']) && $response['success']) {
                return new PaymentResponse(
                    success: true,
                    message: 'Refund initiated successfully',
                    transactionId: $response['data']['refund_id'] ?? null,
                    data: $response['data'] ?? []
                );
            }

            return new PaymentResponse(
                success: false,
                message: $response['message'] ?? 'Refund failed',
                errors: $response['errors'] ?? []
            );

        } catch (\Exception $e) {
            return new PaymentResponse(
                success: false,
                message: 'Refund processing error',
                errors: ['exception' => $e->getMessage()]
            );
        }
    }

    public function getAvailablePaymentMethods(): array
    {
        return [
            [
                'id' => 'mobile_money',
                'name' => 'Mobile Money',
                'description' => 'Pay with Airtel Money or TNM Mpamba',
            ],
            [
                'id' => 'bank',
                'name' => 'Bank Transfer',
                'description' => 'Pay via bank transfer',
            ],
        ];
    }

    /**
     * Authenticate with OneKhusa API to get access token
     */
    private function authenticate(): void
    {
        $cacheKey = 'onekhusa_access_token';

        if (Cache::has($cacheKey)) {
            $this->accessToken = Cache::get($cacheKey);
            return;
        }

        try {

            Log::debug('OneKhusa authentication attempt', [
                'apiKey' => $this->apiKey,
                'apiSecret' => $this->apiSecret,
                'organisationId' => $this->organizationId,
                'merchantAccountNumber' => (int) $this->merchantAccountNumber,
            ]);

            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/account/getAccessToken', [
                'apiKey' => $this->apiKey,
                'apiSecret' => $this->apiSecret,
                'organisationId' => $this->organizationId,
                'merchantAccountNumber' => (int) $this->merchantAccountNumber,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $this->accessToken = $data['access_token'] ?? null;

                if ($this->accessToken) {
                    // Cache token for 50 minutes (tokens usually last 1 hour)
                    Cache::put($cacheKey, $this->accessToken, now()->addMinutes(50));
                }
            } else {
                Log::error('OneKhusa authentication failed', [
                    'status' => $response->status(),
                    'body' => $response->json() ?? $response->body(),
                ]);

                throw new \Exception('Failed to authenticate with OneKhusa');
            }
        } catch (\Exception $e) {
            Log::error('OneKhusa authentication error: ' . $e->getMessage());
            throw $e;
        }
    }

    private function makeRequest(string $method, string $endpoint, array $data = []): array
    {
        $url = $this->baseUrl . $endpoint;

        try {
            $request = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->accessToken,
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ]);

            $response = match (strtoupper($method)) {
                'POST' => $request->post($url, $data),
                'GET' => $request->get($url, $data),
                'PUT' => $request->put($url, $data),
                'DELETE' => $request->delete($url),
                default => throw new \Exception("Unsupported HTTP method: {$method}")
            };

            if ($response->successful()) {
                return $response->json() ?: [];
            }

            $errorData = $response->json() ?: [];
            Log::error('OneKhusa API Error', [
                'status' => $response->status(),
                'response' => $errorData,
                'url' => $url,
            ]);

            return [
                'success' => false,
                'message' => $errorData['message'] ?? 'OneKhusa API error',
                'errors' => $errorData['errors'] ?? [],
            ];

        } catch (\Illuminate\Http\Client\RequestException $e) {
            Log::error('OneKhusa HTTP Error', ['message' => $e->getMessage()]);
            throw new \Exception('Failed to connect to OneKhusa API');
        }
    }

    private function verifyWebhookSignature(array $payload): bool
    {
        $signature = request()->header('X-OneKhusa-Signature', '');
        $computedSignature = hash_hmac('sha256', json_encode($payload), $this->apiSecret);
        return hash_equals($signature, $computedSignature);
    }
}
