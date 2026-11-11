<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TopupTransactionFactory extends Factory
{
    public function definition(): array
    {
        $baseAmount = fake()->randomElement([20000, 50000, 100000, 200000]);
        // Kode unik acak, misalnya 063, 163, 263
        $uniqueCode = fake()->numberBetween(1, 9) * 100 + 63; 
        
        return [
            'user_id' => User::factory(),
            'base_amount' => $baseAmount,
            'unique_code' => $uniqueCode,
            'total_transfer' => $baseAmount + $uniqueCode,
            'proof_image' => 'proofs/' . fake()->uuid() . '.jpg',
            'status' => fake()->randomElement(['pending', 'verifying', 'approved', 'rejected']),
        ];
    }
}