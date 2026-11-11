<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Plan;
use App\Models\Project;
use App\Models\Deployment;
use App\Models\TopupTransaction;
use App\Models\BillingLedger;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Buat 1 Akun Admin / Developer Utama
        User::create([
            'name' => 'Administrator PaaS',
            'email' => 'admin@gmail.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'wallet_balance' => 0,
        ]);

        // 2. Buat Akun User (Mahasiswa) untuk testing
        User::create([
            'name' => 'Moch Djauharil Ilmi',
            'email' => 'mdjauharil29@gmail.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'wallet_balance' => 150000, // Diberi saldo awal untuk testing
        ]);
    }
}