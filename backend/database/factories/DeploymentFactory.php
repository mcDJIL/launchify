<?php

namespace Database\Factories;

use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

class DeploymentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'action' => fake()->randomElement(['build', 'start', 'stop', 'restart']),
            'status' => fake()->randomElement(['pending', 'processing', 'success', 'failed']),
            'log_output' => fake()->text(200),
            'duration_seconds' => fake()->numberBetween(10, 300),
        ];
    }
}