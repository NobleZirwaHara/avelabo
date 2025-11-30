<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('gateway_id')->constrained('payment_gateways');
            $table->string('transaction_id')->nullable(); // Gateway transaction ID
            $table->string('reference')->unique(); // Our internal reference
            $table->decimal('amount', 15, 2);
            $table->foreignId('currency_id')->constrained('currencies');
            $table->enum('status', [
                'pending',
                'processing',
                'completed',
                'failed',
                'cancelled',
                'refunded',
                'partially_refunded'
            ])->default('pending');
            $table->string('payment_method')->nullable(); // 'card', 'mobile_money', 'bank_transfer'
            $table->json('gateway_response')->nullable(); // Raw response from gateway
            $table->text('failure_reason')->nullable();
            $table->string('payer_email')->nullable();
            $table->string('payer_phone')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index('order_id');
            $table->index('transaction_id');
            $table->index('reference');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
