<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Project;
use App\Models\BillingLedger;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessHourlyBilling extends Command
{
    // Nama command yang akan dieksekusi di terminal
    protected $signature = 'billing:process-hourly';
    protected $description = 'Memproses potongan tagihan per jam untuk project yang aktif (Pay-As-You-Go)';

    public function handle()
    {
        $this->info('Memulai kalkulasi tagihan PaaS...');

        // Ambil semua aplikasi user yang sedang berjalan di VPS
        $projects = Project::where('status', 'active')->with(['user', 'plan'])->get();

        foreach ($projects as $project) {
            $user = $project->user;
            $hourlyCost = $project->plan->price_per_hour;

            // Cek apakah saldo masih mencukupi
            if ($user->wallet_balance >= $hourlyCost) {
                
                DB::beginTransaction();
                try {
                    // 1. Kurangi saldo user
                    $user->wallet_balance -= $hourlyCost;
                    $user->save();

                    // 2. Catat pemotongan di Ledger
                    BillingLedger::create([
                        'user_id' => $user->id,
                        'project_id' => $project->id,
                        'description' => "Hourly usage deduction for {$project->name}",
                        'amount' => $hourlyCost,
                        'type' => 'debit'
                    ]);

                    DB::commit();
                    $this->info("Berhasil memotong Rp {$hourlyCost} dari {$user->email} untuk {$project->name}");
                    
                } catch (\Exception $e) {
                    DB::rollBack();
                    Log::error("Gagal memotong tagihan untuk {$project->name}: " . $e->getMessage());
                }

            } else {
                // AUTO-SUSPEND: Jika saldo habis, ubah status project menjadi tersuspensi
                // (Nantinya, ini juga akan memicu command SSH untuk men-stop Docker container di Oracle VPS)
                $project->update(['status' => 'suspended']);
                
                $this->warn("Project {$project->name} disuspend! Saldo {$user->email} tidak mencukupi.");
                Log::warning("Auto-Suspend Triggered: {$project->name} due to insufficient balance.");
            }
        }

        $this->info('Kalkulasi tagihan selesai.');
    }
}