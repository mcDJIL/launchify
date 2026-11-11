<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Deployment;
use Illuminate\Http\Request;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

class DeploymentController extends Controller
{
    public function trigger(Request $request, string $projectId)
    {
        $request->validate([
            'action' => 'required|in:build,start,stop,restart'
        ]);

        $project = $request->user()->projects()->findOrFail($projectId);

        // Validasi Saldo: Cegah user menjalankan aplikasi jika saldo habis/minus
        if (in_array($request->action, ['build', 'start', 'restart']) && $request->user()->wallet_balance <= 0) {
            return response()->json([
                'message' => 'Saldo tidak mencukupi untuk menjalankan aplikasi. Silakan Top-Up QRIS.'
            ], 403);
        }

        // 1. Catat transaksi deployment di awal dengan status 'processing'
        $deployment = Deployment::create([
            'project_id' => $project->id,
            'action' => $request->action,
            'status' => 'processing',
        ]);

        try {
            // 2. Dapatkan string perintah bash (script Docker)
            $command = $this->getBashCommand($request->action, $project);
            
            // 3. Eksekusi perintah ke OS menggunakan Symfony Process
            $process = Process::fromShellCommandline($command);
            $process->setTimeout(300); // Beri batas waktu 5 menit untuk proses build
            $process->run();

            // Jika exit code dari terminal mengindikasikan error
            if (!$process->isSuccessful()) {
                throw new ProcessFailedException($process);
            }

            // 4. Update transaksi deployment menjadi sukses beserta log terminalnya
            $deployment->update([
                'status' => 'success',
                'log_output' => $process->getOutput(),
            ]);

            // 5. Update status project sesuai action
            $newStatus = in_array($request->action, ['build', 'start', 'restart']) ? 'active' : 'stopped';
            $project->update(['status' => $newStatus]);

            return response()->json([
                'message' => 'Deployment eksekusi berhasil',
                'data' => $deployment
            ]);

        } catch (\Exception $e) {
            // Jika terjadi kegagalan (misal Docker error, Github repo private, dll)
            $deployment->update([
                'status' => 'failed',
                'log_output' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Terjadi kesalahan saat deployment infrastruktur',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper untuk merakit perintah bash/shell sesuai aksi yang diminta
     */
    private function getBashCommand($action, $project)
    {
        // Direktori tempat kita akan menyimpan clone repository di VPS
        $workdir = "/var/www/paas_projects/project_{$project->id}";
        
        return match($action) {
            'build' => "mkdir -p {$workdir} && cd {$workdir} && rm -rf ./* && git clone {$project->github_url} . && docker build -t img_project_{$project->id} .",
            'start' => "docker run -d --name container_{$project->id} -p {$project->docker_port}:80 img_project_{$project->id}",
            'stop'  => "docker stop container_{$project->id} && docker rm container_{$project->id}",
            'restart' => "docker restart container_{$project->id}",
            default => "echo 'Action tidak dikenali'",
        };
    }
}