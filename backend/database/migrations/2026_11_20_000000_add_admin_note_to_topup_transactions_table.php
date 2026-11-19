<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Menyimpan catatan admin, dipakai sebagai alasan saat transaksi ditolak.
     */
    public function up(): void
    {
        Schema::table('topup_transactions', function (Blueprint $table) {
            $table->string('admin_note')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('topup_transactions', function (Blueprint $table) {
            $table->dropColumn('admin_note');
        });
    }
};
