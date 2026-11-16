<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $dailyPrice = 1000;
        $hourlyPrice = round($dailyPrice / 24, 4); // 41.6667 (jika dikali 24 jam = Rp 1.000,00)

        $plans = [
            // Framework: Rp 1.000/hari (~Rp 41,67/jam)
            ['name' => 'Laravel', 'code' => 'laravel', 'type' => 'framework', 'price_per_hour' => $hourlyPrice],
            ['name' => 'Node.js / Express', 'code' => 'express', 'type' => 'framework', 'price_per_hour' => $hourlyPrice],
            ['name' => 'React (Vite)', 'code' => 'react', 'type' => 'framework', 'price_per_hour' => $hourlyPrice],
            ['name' => 'Vue.js', 'code' => 'vue', 'type' => 'framework', 'price_per_hour' => $hourlyPrice],
            ['name' => 'HTML / Static', 'code' => 'html', 'type' => 'framework', 'price_per_hour' => $hourlyPrice],
            ['name' => 'Golang', 'code' => 'golang', 'type' => 'framework', 'price_per_hour' => $hourlyPrice],

            // Database: Rp 0 (Gratis / Included)
            ['name' => 'Tanpa Database', 'code' => 'none', 'type' => 'database', 'price_per_hour' => 0],
            ['name' => 'MySQL 8.0', 'code' => 'mysql', 'type' => 'database', 'price_per_hour' => 0],
            ['name' => 'PostgreSQL 15', 'code' => 'postgresql', 'type' => 'database', 'price_per_hour' => 0],
        ];
    }
}
