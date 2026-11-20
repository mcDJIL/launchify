<?php

namespace App\Jobs;

use App\Models\Deployment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Symfony\Component\Process\Process;

class RunDeployment implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 1800;
    public int $tries = 1;

    public function __construct(public int $deploymentId, public string $command)
    {
    }

    public function handle(): void
    {
        $deployment = Deployment::findOrFail($this->deploymentId);

        $process = Process::fromShellCommandline($this->command);
        $process->setTimeout(1500);
        $process->start();

        // Tulis output secara bertahap agar UI bisa menampilkan live log.
        $output = '';
        $lastFlush = 0.0;

        while ($process->isRunning()) {
            $output .= $process->getIncrementalOutput();
            $output .= $process->getIncrementalErrorOutput();

            if (microtime(true) - $lastFlush >= 1.0) {
                $deployment->update(['log_output' => $output]);
                $lastFlush = microtime(true);
            }

            usleep(300000);
        }

        $output .= $process->getIncrementalOutput();
        $output .= $process->getIncrementalErrorOutput();

        $deployment->update([
            'status' => $process->isSuccessful() ? 'success' : 'failed',
            'log_output' => $output,
        ]);

        if ($process->isSuccessful()) {
            $deployment->project->update(['status' => 'active']);
        }
    }
}
