<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProjectFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(), // Otomatis buat user jika tidak didefinisikan
            'plan_id' => Plan::factory(),
            'name' => fake()->domainWord() . '-api',
            'github_url' => 'https://github.com/mcDJIL/' . fake()->slug(),
            'docker_port' => fake()->numberBetween(3000, 9000),
            'status' => fake()->randomElement(['active', 'suspended', 'stopped']),
        ];
    }
}