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
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Contoh: Free, Developer, Enterprise
            $table->integer('ram_mb');
            $table->integer('cpu_cores');
            $table->integer('storage_gb');
            $table->decimal('price_per_hour', 10, 2); // Biaya pemotongan per jam
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
