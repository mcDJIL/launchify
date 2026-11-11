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
        // Hapus spesifikasi hardware yang tidak terpakai
        $table->dropColumn(['cpu_cores', 'ram_mb', 'storage_gb']); 
        
        // Tambahkan pengelompokan framework/database
        $table->string('code')->after('id'); // misal: 'laravel', 'mysql'
            $table->enum('type', ['framework', 'database'])->after('name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            // Tambahkan kembali spesifikasi hardware
            $table->integer('cpu_cores')->nullable();
            $table->integer('ram_mb')->nullable();
            $table->integer('storage_gb')->nullable();
            
            // Hapus kolom pengelompokan framework/database
            $table->dropColumn(['code', 'type']);
        });
    }
};
