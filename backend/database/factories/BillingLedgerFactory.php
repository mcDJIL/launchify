<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

class BillingLedgerFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'project_id' => Project::factory(),
            'description' => 'Hourly usage deduction for ' . fake()->domainWord(),
            'amount' => fake()->randomFloat(2, 50, 500),
            'type' => fake()->randomElement(['credit', 'debit']),
        ];
    }
}