<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Plan;
use App\Models\Project;
use App\Models\Deployment;
use App\Models\TopupTransaction;
use App\Models\BillingLedger;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Buat 1 Akun Admin / Developer Utama
        $admin = User::factory()->create([
            'name' => 'Moch Djauharil Ilmi',
            'email' => 'admin@paas.local',
            'wallet_balance' => 500000,
        ]);

        // 2. Buat 3 Data Plan
        $plans = Plan::factory()->count(3)->create();

        // 3. Buat 10 User beserta relasi Project, Topup, dan Ledger
        User::factory(10)->create()->each(function ($user) use ($plans) {
            // Tiap user punya 1-3 project
            $projects = Project::factory(rand(1, 3))->create([
                'user_id' => $user->id,
                'plan_id' => $plans->random()->id,
            ]);

            // Tiap project punya riwayat deployment
            $projects->each(function ($project) {
                Deployment::factory(rand(2, 5))->create([
                    'project_id' => $project->id,
                ]);
            });

            // Tiap user punya riwayat topup dan billing
            TopupTransaction::factory(rand(1, 3))->create(['user_id' => $user->id]);
            BillingLedger::factory(rand(5, 10))->create([
                'user_id' => $user->id,
                'project_id' => $projects->random()->id,
            ]);
        });
    }
}