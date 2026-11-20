<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            // Dockerfile kustom per template. Placeholder {{PORT}} diganti port container.
            $table->text('dockerfile')->nullable()->after('price_per_hour');
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn('dockerfile');
        });
    }
};
