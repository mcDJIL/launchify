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
    public function logs(Request $request, string $projectId)
    {
        $project = $request->user()->projects()->findOrFail($projectId);

        try {
            // Mengambil 100 baris log terakhir dari container project ini
            $command = "docker logs --tail 100 container_{$project->id}";
            $process = Process::fromShellCommandline($command);
            $process->run();

            // Docker log seringkali masuk ke channel error (stderr) meskipun itu bukan error.
            // Jadi kita gabungkan output standar (stdout) dan error (stderr).
            $output = $process->getOutput() . "\n" . $process->getErrorOutput();

            return response()->json([
                'logs' => $output ?: 'Tidak ada log yang tersedia atau container belum pernah dijalankan.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil log dari server.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

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
        $domainKamu = "app.launchify.site"; 
        $cleanName = strtolower(preg_replace('/[^a-zA-Z0-9-]/', '', $project->name));
        $subdomain = "{$cleanName}.{$domainKamu}";
        $nginxConfPath = "/var/www/paas_projects/nginx_configs/{$project->id}.conf";
        
        // Auto-Assign Host Port jika belum ada
        if (empty($project->host_port)) {
            $lastPort = Project::max('host_port') ?? 8000;
            $project->host_port = $lastPort + 1;
            $project->save();
        }
        
        $hostPort = $project->host_port;          // Contoh: 8001 (Auto-generated)
        $containerPort = $project->docker_port;   // Contoh: 80 atau 3000 (Input user)

        if ($action === 'build') {
            
            $envContent = $project->custom_env ?? "";
            
            if ($project->db_type === 'mysql') {
                $envContent .= "\n\n# Auto-Injected Database\nDB_CONNECTION=mysql\nDB_HOST=db\nDB_PORT=3306\nDB_DATABASE={$project->db_name}\nDB_USERNAME={$project->db_user}\nDB_PASSWORD={$project->db_password}\n";
            } elseif ($project->db_type === 'postgresql') {
                $envContent .= "\n\n# Auto-Injected Database\nDB_CONNECTION=pgsql\nDB_HOST=db\nDB_PORT=5432\nDB_DATABASE={$project->db_name}\nDB_USERNAME={$project->db_user}\nDB_PASSWORD={$project->db_password}\n";
            }

            $envBase64 = base64_encode($envContent);

            $dockerfileContent = match($project->framework) {
                'laravel' => "FROM php:8.2-fpm\\nRUN apt-get update && apt-get install -y pdo_mysql pdo_pgsql\\nCOPY . .\\nCMD [\"php-fpm\"]",
                'html' => "FROM nginx:alpine\\nCOPY . /usr/share/nginx/html",
                'express' => "FROM node:18-alpine\\nWORKDIR /app\\nCOPY package*.json ./\\nRUN npm install\\nCOPY . .\\nEXPOSE {$containerPort}\\nCMD [\"npm\", \"start\"]",
                'react', 'vue' => "FROM node:18-alpine AS builder\\nWORKDIR /app\\nCOPY package*.json ./\\nRUN npm install\\nCOPY . .\\nRUN npm run build\\nFROM nginx:alpine\\nCOPY --from=builder /app/dist /usr/share/nginx/html\\nEXPOSE 80",
                'golang' => "FROM golang:1.21-alpine AS builder\\nWORKDIR /app\\nCOPY . .\\nRUN go build -o main .\\nFROM alpine:latest\\nWORKDIR /app\\nCOPY --from=builder /app/main .\\nEXPOSE {$containerPort}\\nCMD [\"./main\"]",
                default => "FROM nginx:alpine\\nCOPY . /usr/share/nginx/html"
            };

            // Perhatikan bagian ports: docker compose sekarang diikat kuat ke 127.0.0.1
            $composeContent = "version: '3.8'\\nservices:\\n  app:\\n    build: .\\n    container_name: app_{$project->id}\\n    ports:\\n      - '127.0.0.1:{$hostPort}:{$containerPort}'\\n";
            
            if ($project->db_type === 'mysql') {
                $composeContent .= "  db:\\n    image: mysql:8.0\\n    container_name: db_{$project->id}\\n    environment:\\n      MYSQL_DATABASE: {$project->db_name}\\n      MYSQL_USER: {$project->db_user}\\n      MYSQL_PASSWORD: {$project->db_password}\\n      MYSQL_ROOT_PASSWORD: root_{$project->db_password}\\n";
            } elseif ($project->db_type === 'postgresql') {
                $composeContent .= "  db:\\n    image: postgres:15-alpine\\n    container_name: db_{$project->id}\\n    environment:\\n      POSTGRES_DB: {$project->db_name}\\n      POSTGRES_USER: {$project->db_user}\\n      POSTGRES_PASSWORD: {$project->db_password}\\n";
            }

            // Nginx proxy meneruskan trafik ke hostPort
            $nginxConfig = "
    server {
        listen 80;
        listen 443 ssl;
        server_name {$subdomain};

        ssl_certificate /etc/letsencrypt/live/app.launchify.site/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/app.launchify.site/privkey.pem;

        location / {
            proxy_pass http://127.0.0.1:{$hostPort};
            proxy_set_header Host \\\$host;
            proxy_set_header X-Real-IP \\\$remote_addr;
            proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \\\$scheme;
        }
    }";
            $nginxBase64 = base64_encode($nginxConfig);

            return "mkdir -p {$workdir} && cd {$workdir} && rm -rf ./* && git clone {$project->github_url} . && echo '{$envBase64}' | base64 -d > .env && echo -e '{$dockerfileContent}' > Dockerfile && echo -e '{$composeContent}' > docker-compose.yml && docker compose build && echo '{$nginxBase64}' | base64 -d > {$nginxConfPath} && sudo systemctl reload nginx";
        }
        
        return match($action) {
            'start' => "cd {$workdir} && docker compose up -d && sudo systemctl reload nginx",
            'stop'  => "cd {$workdir} && docker compose down", 
            'restart' => "cd {$workdir} && docker compose restart",
        };
    }
}