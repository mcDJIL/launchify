<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE deployments MODIFY action ENUM('build', 'start', 'stop', 'restart', 'update') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('deployments')->where('action', 'update')->delete();
        DB::statement("ALTER TABLE deployments MODIFY action ENUM('build', 'start', 'stop', 'restart') NOT NULL");
    }
};
