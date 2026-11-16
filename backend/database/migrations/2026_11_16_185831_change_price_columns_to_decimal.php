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
        Schema::table('plans', function (Blueprint $table) {
            $table->decimal('price_per_hour', 10, 4)->change();
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->decimal('hourly_rate', 10, 4)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->decimal('price_per_hour', 10, 2)->change();
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->decimal('hourly_rate', 10, 2)->change();
        });
    }
};
