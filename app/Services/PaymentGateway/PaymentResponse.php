<?php

namespace App\Services\PaymentGateway;

class PaymentResponse
{
    public function __construct(
        public bool $success,
        public string $message,
        public ?string $transactionId = null,
        public ?string $redirectUrl = null,
        public array $data = [],
        public array $errors = []
    ) {}

    public function toArray(): array
    {
        return [
            'success' => $this->success,
            'message' => $this->message,
            'transaction_id' => $this->transactionId,
            'redirect_url' => $this->redirectUrl,
            'data' => $this->data,
            'errors' => $this->errors,
        ];
    }

    public function isSuccessful(): bool
    {
        return $this->success;
    }

    public function hasRedirect(): bool
    {
        return !empty($this->redirectUrl);
    }
}
