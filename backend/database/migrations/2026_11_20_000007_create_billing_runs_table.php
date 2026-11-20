<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('billing_runs', function (Blueprint $table) {
            $table->id();
            $table->timestamp('run_at');
            $table->unsignedInteger('projects_charged')->default(0);
            $table->decimal('total_charged', 15, 2)->default(0);
            $table->unsignedInteger('projects_skipped')->default(0);
            $table->unsignedInteger('projects_suspended')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_runs');
    }
};
