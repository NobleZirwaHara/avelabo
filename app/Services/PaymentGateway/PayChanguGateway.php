<?php

namespace App\Services\PaymentGateway;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PayChanguGateway implements PaymentGatewayInterface
{
    private string $apiKey;
    private string $secretKey;
    private string $baseUrl;
    private bool $testMode;

    public function __construct()
    {
        $this->apiKey = config('services.paychangu.api_key');
        $this->secretKey = config('services.paychangu.secret_key');
        $this->testMode = config('services.paychangu.test_mode', true);
        $this->baseUrl = $this->testMode
            ? 'https://api.paychangu.com/test'
            : 'https://api.paychangu.com';
    }

    public function initializePayment(Order $order, array $options = []): PaymentResponse
    {
        try {
            $payload = [
                'amount' => $order->total,
                'currency' => 'MWK',
                'email' => $order->user->email,
                'first_name' => $order->billingAddress?->first_name ?? $order->user->name,
                'last_name' => $order->billingAddress?->last_name ?? '',
                'tx_ref' => $order->order_number,
                'callback_url' => $options['callback_url'] ?? route('payment.callback'),
                'return_url' => $options['return_url'] ?? route('checkout.success', ['order' => $order->order_number]),
                'customization' => [
                    'title' => $options['title'] ?? 'Avelabo Payment',
                    'description' => $options['description'] ?? 'Payment for Order #' . $order->order_number,
                ],
                'meta' => [
                    'order_id' => $order->id,
                    'user_id' => $order->user_id,
                ],
            ];

            if (isset($options['payment_method'])) {
                $payload['payment_method'] = $options['payment_method'];
            }

            $response = $this->makeRequest('POST', '/payment', $payload);

            if (isset($response['status']) && $response['status'] === 'success') {
                return new PaymentResponse(
                    success: true,
                    message: 'Payment initialized successfully',
                    transactionId: $response['data']['tx_ref'] ?? $order->order_number,
                    redirectUrl: $response['data']['checkout_url'] ?? null,
                    data: $response['data'] ?? []
                );
            }

            return new PaymentResponse(
                success: false,
                message: $response['message'] ?? 'Failed to initialize payment',
                errors: $response['errors'] ?? []
            );

        } catch (\Exception $e) {
            Log::error('PayChangu initialization error: ' . $e->getMessage());

            return new PaymentResponse(
                success: false,
                message: 'Payment initialization failed. Please try again.',
                errors: ['exception' => $e->getMessage()]
            );
        }
    }

    public function processPayment(string $transactionReference, array $data): PaymentResponse
    {
        return new PaymentResponse(
            success: true,
            message: 'Use checkout URL for payment processing',
            transactionId: $transactionReference
        );
    }

    public function verifyPayment(string $transactionReference): PaymentResponse
    {
        try {
            $response = $this->makeRequest('GET', "/payments/verify/{$transactionReference}");

            if (isset($response['status']) && $response['status'] === 'success' &&
                isset($response['data']['status']) && $response['data']['status'] === 'successful') {

                return new PaymentResponse(
                    success: true,
                    message: 'Payment verified successfully',
                    transactionId: $transactionReference,
                    data: $response['data'] ?? []
                );
            }

            return new PaymentResponse(
                success: false,
                message: 'Payment verification failed or payment not completed',
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
            if (!$this->verifyWebhookSignature($payload)) {
                return new PaymentResponse(
                    success: false,
                    message: 'Invalid webhook signature'
                );
            }

            $reference = $payload['data']['tx_ref'] ?? $payload['data']['reference'] ?? null;
            if (!$reference) {
                return new PaymentResponse(
                    success: false,
                    message: 'No transaction reference in webhook'
                );
            }

            return $this->verifyPayment($reference);

        } catch (\Exception $e) {
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
            $response = $this->makeRequest('POST', '/payments/refund', [
                'amount' => $amount,
                'reference' => $transactionReference,
            ]);

            if (isset($response['status']) && $response['status'] === 'success') {
                return new PaymentResponse(
                    success: true,
                    message: 'Refund processed successfully',
                    transactionId: $response['data']['refund_reference'] ?? null,
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
                'id' => 'airtel_money',
                'name' => 'Airtel Money',
                'description' => 'Pay with Airtel Money mobile wallet',
            ],
            [
                'id' => 'tnm_mpamba',
                'name' => 'TNM Mpamba',
                'description' => 'Pay with TNM Mpamba mobile wallet',
            ],
            [
                'id' => 'bank_transfer',
                'name' => 'Bank Transfer',
                'description' => 'Direct bank transfer',
            ],
            [
                'id' => 'card',
                'name' => 'Credit/Debit Card',
                'description' => 'Pay with Visa or Mastercard',
            ],
        ];
    }

    private function makeRequest(string $method, string $endpoint, array $data = []): array
    {
        $url = $this->baseUrl . $endpoint;

        try {
            $request = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Accept' => 'application/json',
            ]);

            if ($this->testMode) {
                $request = $request->withoutVerifying();
            }

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
            Log::error('PayChangu API Error', [
                'status' => $response->status(),
                'response' => $errorData,
                'url' => $url,
            ]);

            throw new \Exception($errorData['message'] ?? 'PayChangu API error');

        } catch (\Illuminate\Http\Client\RequestException $e) {
            Log::error('PayChangu HTTP Error', ['message' => $e->getMessage()]);
            throw new \Exception('Failed to connect to PayChangu API');
        }
    }

    private function verifyWebhookSignature(array $payload): bool
    {
        $signature = request()->header('X-PayChangu-Signature', '');
        $computedSignature = hash_hmac('sha256', json_encode($payload), $this->secretKey);
        return hash_equals($signature, $computedSignature);
    }
}
