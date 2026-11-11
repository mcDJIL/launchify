<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class PlanFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->randomElement(['Starter', 'Developer', 'Production', 'Enterprise']),
            'ram_mb' => fake()->randomElement([512, 1024, 2048, 4096]),
            'cpu_cores' => fake()->randomElement([1, 2, 4]),
            'storage_gb' => fake()->randomElement([10, 20, 50, 100]),
            'price_per_hour' => fake()->randomFloat(2, 50, 1000), // Rp 50 - Rp 1000 per jam
        ];
    }
}