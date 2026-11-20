<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Live log build bisa melebihi batas TEXT (64KB), pakai LONGTEXT.
        Schema::table('deployments', function (Blueprint $table) {
            $table->longText('log_output')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('deployments', function (Blueprint $table) {
            $table->text('log_output')->nullable()->change();
        });
    }
};
