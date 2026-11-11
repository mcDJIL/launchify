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
        $workdir = "/var/www/paas_projects/project_{$project->id}";
        $port = $project->docker_port;
        
        if ($action === 'build') {
            
            // 1. Rangkai isi .env (Custom dari User + Auto Database)
            $envContent = $project->custom_env ?? "";
            
            if ($project->db_type === 'mysql') {
                $envContent .= "\n\n# Auto-Injected Database\nDB_CONNECTION=mysql\nDB_HOST=db\nDB_PORT=3306\nDB_DATABASE={$project->db_name}\nDB_USERNAME={$project->db_user}\nDB_PASSWORD={$project->db_password}\n";
            } elseif ($project->db_type === 'postgresql') {
                $envContent .= "\n\n# Auto-Injected Database\nDB_CONNECTION=pgsql\nDB_HOST=db\nDB_PORT=5432\nDB_DATABASE={$project->db_name}\nDB_USERNAME={$project->db_user}\nDB_PASSWORD={$project->db_password}\n";
            }

            // Trik DevOps: Encode ke Base64 agar karakter unik ($, &, ") di .env tidak merusak shell script
            $envBase64 = base64_encode($envContent);

            // 2. Generate Dockerfile (Sama seperti sebelumnya)
            $dockerfileContent = match($project->framework) {
                'laravel' => "FROM php:8.2-fpm\\nRUN apt-get update && apt-get install -y pdo_mysql pdo_pgsql\\nCOPY . .\\nCMD [\"php-fpm\"]",
                // ... (framework lain tetap sama)
                default => "FROM nginx:alpine\\nCOPY . /usr/share/nginx/html"
            };

            // 3. Generate docker-compose.yml (Environment DB pindah ke .env, compose jadi lebih bersih)
            $composeContent = "version: '3.8'\\nservices:\\n  app:\\n    build: .\\n    container_name: app_{$project->id}\\n    ports:\\n      - '{$port}:80'\\n";
            
            if ($project->db_type === 'mysql') {
                $composeContent .= "  db:\\n    image: mysql:8.0\\n    container_name: db_{$project->id}\\n    environment:\\n      MYSQL_DATABASE: {$project->db_name}\\n      MYSQL_USER: {$project->db_user}\\n      MYSQL_PASSWORD: {$project->db_password}\\n      MYSQL_ROOT_PASSWORD: root_{$project->db_password}\\n";
            } elseif ($project->db_type === 'postgresql') {
                $composeContent .= "  db:\\n    image: postgres:15-alpine\\n    container_name: db_{$project->id}\\n    environment:\\n      POSTGRES_DB: {$project->db_name}\\n      POSTGRES_USER: {$project->db_user}\\n      POSTGRES_PASSWORD: {$project->db_password}\\n";
            }

            // 4. Return perintah Bash dengan injeksi Base64 decoding
            return "mkdir -p {$workdir} && cd {$workdir} && rm -rf ./* && git clone {$project->github_url} . && echo '{$envBase64}' | base64 -d > .env && echo -e '{$dockerfileContent}' > Dockerfile && echo -e '{$composeContent}' > docker-compose.yml && docker compose build";
        }
        
        // Action lainnya
        return match($action) {
            'start' => "cd {$workdir} && docker compose up -d",
            'stop'  => "cd {$workdir} && docker compose down",
            'restart' => "cd {$workdir} && docker compose restart",
        };
    }
}