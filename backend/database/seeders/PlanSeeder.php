<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $services = [
            ['code' => 'html', 'name' => 'HTML/Statis', 'type' => 'framework', 'price_per_hour' => 50],
            ['code' => 'php', 'name' => 'PHP Native', 'type' => 'framework', 'price_per_hour' => 100],
            ['code' => 'react', 'name' => 'React JS', 'type' => 'framework', 'price_per_hour' => 100],
            ['code' => 'vue', 'name' => 'Vue JS', 'type' => 'framework', 'price_per_hour' => 100],
            ['code' => 'express', 'name' => 'Node.js (Express)', 'type' => 'framework', 'price_per_hour' => 120],
            ['code' => 'laravel', 'name' => 'Laravel', 'type' => 'framework', 'price_per_hour' => 150],
            ['code' => 'golang', 'name' => 'Golang', 'type' => 'framework', 'price_per_hour' => 150],

            ['code' => 'none', 'name' => 'Tanpa Database', 'type' => 'database', 'price_per_hour' => 0],
            ['code' => 'mysql', 'name' => 'MySQL 8', 'type' => 'database', 'price_per_hour' => 150],
            ['code' => 'postgresql', 'name' => 'PostgreSQL 15', 'type' => 'database', 'price_per_hour' => 200], 
        ];

        foreach ($services as $service) {
            Plan::create($service);
        }
    }
}
