<?php

namespace App\Console\Commands;

use App\Models\Project;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;

class ProcessHourlyBilling extends Command
{
    protected $signature = 'billing:process-hourly';
    protected $description = 'Potong saldo user sebesar Rp 1.000/jam untuk setiap project aktif';

    public function handle()
    {
        $activeProjects = Project::where('status', 'running')->get();

        foreach ($activeProjects as $project) {
            // Mengambil tarif dari project (1000)
            $cost = $project->hourly_rate ?? 1000;

            DB::beginTransaction();
            try {
                $user = User::where('id', $project->user_id)->lockForUpdate()->first();

                if (!$user) {
                    DB::rollBack();
                    continue;
                }

                if ($user->balance >= $cost) {
                    $user->decrement('balance', $cost);

                    if (class_exists(Transaction::class)) {
                        Transaction::create([
                            'user_id' => $user->id,
                            'project_id' => $project->id,
                            'type' => 'usage',
                            'amount' => -$cost,
                            'description' => "Tagihan per jam: {$project->name} (Rp " . number_format($cost, 0, ',', '.') . ")",
                        ]);
                    }

                    DB::commit();
                    $this->info("Project #{$project->id}: Saldo user #{$user->id} dipotong Rp {$cost}");
                } else {
                    DB::commit();

                    // Hentikan container otomatis karena saldo kurang dari Rp 1.000
                    $workdir = "/var/www/paas_projects/project_{$project->id}";
                    $appDir = $project->root_directory ? "{$workdir}/{$project->root_directory}" : $workdir;
                    $composeProject = "project_{$project->id}";

                    Process::run("cd {$appDir} && docker compose -p {$composeProject} down");
                    $project->update(['status' => 'stopped']);

                    Log::warning("Project #{$project->id} dihentikan otomatis karena saldo user #{$user->id} habis.");
                }
            } catch (\Throwable $e) {
                DB::rollBack();
                Log::error("Billing error pada project #{$project->id}: " . $e->getMessage());
            }
        }

        return Command::SUCCESS;
    }
}