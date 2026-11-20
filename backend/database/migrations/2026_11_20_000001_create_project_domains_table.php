<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_domains', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('domain')->unique();
            $table->enum('dns_status', ['pending', 'verified', 'failed'])->default('pending');
            $table->enum('ssl_status', ['none', 'pending', 'issued', 'failed'])->default('none');
            $table->timestamp('dns_verified_at')->nullable();
            $table->timestamp('ssl_issued_at')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_domains');
    }
};
