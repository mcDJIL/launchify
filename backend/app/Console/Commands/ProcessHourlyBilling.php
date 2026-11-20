<?php

namespace App\Console\Commands;

use App\Models\Project;
use App\Models\BillingLedger;
use App\Models\BillingRun;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;

class ProcessHourlyBilling extends Command
{
    protected $signature = 'billing:process-hourly';
    protected $description = 'Potong saldo user per jam berdasarkan tarif Rp 1.000/hari (Rp 41,6667/jam)';

    public function handle()
    {
        $activeProjects = Project::where('status', 'active')->get();

        $charged = 0;
        $totalCharged = 0.0;
        $skipped = 0;
        $suspended = 0;

        foreach ($activeProjects as $project) {
            $cost = (float) ($project->hourly_rate ?? 41.6667);

            DB::beginTransaction();
            try {
                $user = User::where('id', $project->user_id)->lockForUpdate()->first();

                if (!$user) {
                    DB::rollBack();
                    $skipped++;
                    continue;
                }

                if ((float) $user->wallet_balance >= $cost) {
                    $user->decrement('wallet_balance', $cost);

                    BillingLedger::create([
                        'user_id' => $user->id,
                        'project_id' => $project->id,
                        'type' => 'debit',
                        'amount' => $cost,
                        'description' => "Biaya server 1 jam: {$project->name}",
                    ]);

                    DB::commit();
                    $charged++;
                    $totalCharged += $cost;
                    $this->info("Project #{$project->id}: Saldo user #{$user->id} dipotong Rp {$cost}");
                } else {
                    DB::commit();

                    $workdir = "/var/www/paas_projects/project_{$project->id}";
                    $appDir = $project->root_directory ? "{$workdir}/{$project->root_directory}" : $workdir;
                    $composeProject = "project_{$project->id}";

                    Process::run("cd {$appDir} && docker compose -p {$composeProject} down");
                    $project->update(['status' => 'stopped']);
                    $suspended++;

                    Log::warning("Project #{$project->id} dihentikan otomatis karena saldo user #{$user->id} habis.");
                }
            } catch (\Throwable $e) {
                DB::rollBack();
                $skipped++;
                Log::error("Billing error pada project #{$project->id}: " . $e->getMessage());
            }
        }

        BillingRun::create([
            'run_at' => now(),
            'projects_charged' => $charged,
            'total_charged' => $totalCharged,
            'projects_skipped' => $skipped,
            'projects_suspended' => $suspended,
            'notes' => "Memproses {$activeProjects->count()} project aktif.",
        ]);

        return Command::SUCCESS;
    }
}