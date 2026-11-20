<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_deploy_keys', function (Blueprint $table) {
            // generated = dibuat server, uploaded = key buatan user sendiri
            $table->string('source')->default('generated')->after('fingerprint');
        });
    }

    public function down(): void
    {
        Schema::table('project_deploy_keys', function (Blueprint $table) {
            $table->dropColumn('source');
        });
    }
};
