<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Deployment;
use App\Jobs\RunDeployment;
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
            $command = "docker logs --tail 100 app_{$project->id}";
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

    public function showDeployment(Request $request, string $projectId, string $deploymentId)
    {
        $project = $request->user()->projects()->findOrFail($projectId);
        $deployment = $project->deployments()->findOrFail($deploymentId);

        return response()->json([
            'id' => $deployment->id,
            'action' => $deployment->action,
            'status' => $deployment->status,
            'log_output' => $deployment->log_output,
        ]);
    }

    public function trigger(Request $request, string $projectId)
    {
        $request->validate([
            'action' => 'required|in:build,start,stop,restart,update'
        ]);

        $project = $request->user()->projects()->findOrFail($projectId);

        // Validasi Saldo: Cegah user menjalankan aplikasi jika saldo habis/minus
        if (in_array($request->action, ['build', 'start', 'restart', 'update'])) {
            $rate = (float) ($project->hourly_rate ?? 41.6667);
            if ((float) $request->user()->wallet_balance < $rate) {
                return response()->json([
                    'message' => 'Saldo tidak mencukupi untuk menyalakan aplikasi (tarif Rp 1.000/hari atau ~Rp 42/jam).',
                ], 402);
            }
        }

        if (in_array($request->action, ['start', 'restart', 'stop', 'update']) && !Deployment::where('project_id', $project->id)->where('action', 'build')->where('status', 'success')->exists()) {
            return response()->json([
                'message' => 'Build project ini sampai berhasil terlebih dahulu sebelum menjalankan aksi ini'
            ], 422);
        }

        if ($request->action === 'update' && Deployment::where('project_id', $project->id)->where('status', 'processing')->exists()) {
            return response()->json([
                'message' => 'Masih ada proses deployment yang berjalan untuk project ini'
            ], 409);
        }

        // 1. Catat transaksi deployment di awal dengan status 'processing'
        $deployment = Deployment::create([
            'project_id' => $project->id,
            'action' => $request->action,
            'status' => 'processing',
        ]);

        if ($request->action === 'update') {
            RunDeployment::dispatch($deployment->id, $this->getBashCommand('update', $project));

            return response()->json(['message' => 'Update dijadwalkan', 'data' => $deployment], 202);
        }

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
     * Pakai SSH deploy key saat clone jika project sudah punya key.
     * URL https GitHub otomatis diubah ke bentuk SSH agar key dipakai.
     *
     * @return array{0: string, 1: string} [prefix perintah, url clone]
     */
    private function resolveCloneSource($project): array
    {
        $url = $project->github_url;
        $key = $project->deployKey;

        if (!$key || !is_file($key->private_key_path)) {
            return ['', $url];
        }

        if (preg_match('#^https?://github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$#i', $url, $matches)) {
            $url = "git@github.com:{$matches[1]}/{$matches[2]}.git";
        } elseif (!preg_match('#^(git@|ssh://)#', $url)) {
            // Bukan repo GitHub SSH, biarkan clone seperti biasa.
            return ['', $url];
        }

        $prefix = "GIT_SSH_COMMAND='ssh -i {$key->private_key_path} -o IdentitiesOnly=yes -o StrictHostKeyChecking=no' ";

        return [$prefix, $url];
    }

    /**
     * Helper untuk merakit perintah bash/shell sesuai aksi yang diminta
     */
    private function getBashCommand($action, $project)
    {
        $workdir = "/var/www/paas_projects/project_{$project->id}";
        
        // 1. AUTO-DETECT: Jika user klik Start tapi foldernya belum ada, paksa ke mode Build!
        if ($action === 'start' && !is_dir($workdir)) {
            $action = 'build';
        }

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

        if (in_array($project->db_type, ['mysql', 'postgresql']) && empty($project->db_port)) {
            $lastDbPort = Project::max('db_port') ?? 9000;
            $project->db_port = $lastDbPort + 1;
            $project->save();
        }

        $defaultPort = match($project->framework) {
            'laravel', 'html', 'react', 'vue' => 80,
            'express' => 3000,
            'golang' => 8080,
            default => 80
        };
        
        $containerPort = in_array($project->framework, ['laravel', 'html', 'react', 'vue']) 
                        ? 80 
                        : ($project->docker_port ?: $defaultPort);
        if ($project->docker_port != $containerPort) {
            $project->docker_port = $containerPort;
            $project->save();
        }

        $hostPort = $project->host_port;      
        $dbPort = $project->db_port;    
        $appDir = $project->root_directory ? "{$workdir}/{$project->root_directory}" : $workdir;
        $composeProject = "project_{$project->id}";

        $releaseCmd = "";
        if (!empty($project->release_command)) {
            $safeRelease = escapeshellarg($project->release_command);
            // Beri jeda 5 detik agar container DB siap menerima koneksi saat pertama kali start
            $releaseCmd = " && sleep 5 && docker exec app_{$project->id} sh -c {$safeRelease}";
        }

        if ($action === 'build') {
        
            // 1. Setup ENV (Sama seperti sebelumnya)
            $envContent = $project->custom_env ?? "";
            
            if ($project->db_type === 'mysql') {
                $envContent .= "\n\n# Auto-Injected Database\nDB_CONNECTION=mysql\nDB_HOST=db\nDB_PORT=3306\nDB_DATABASE={$project->db_name}\nDB_USERNAME={$project->db_user}\nDB_PASSWORD={$project->db_password}\n";
            } elseif ($project->db_type === 'postgresql') {
                $envContent .= "\n\n# Auto-Injected Database\nDB_CONNECTION=pgsql\nDB_HOST=db\nDB_PORT=5432\nDB_DATABASE={$project->db_name}\nDB_USERNAME={$project->db_user}\nDB_PASSWORD={$project->db_password}\n";
            }

            $envBase64 = base64_encode($envContent);

            // 2. Setup Dockerfile (Mengubah \\n menjadi \n untuk Base64)
            $defaultDockerfile = match($project->framework) {
                'laravel' => "FROM php:8.2-apache\nRUN apt-get update && apt-get install -y libpq-dev unzip git && docker-php-ext-install pdo pdo_mysql pdo_pgsql\nRUN a2enmod rewrite\nCOPY --from=composer:latest /usr/bin/composer /usr/bin/composer\nWORKDIR /var/www/html\nCOPY . .\nRUN composer install --no-dev --optimize-autoloader\nRUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache\nRUN sed -i -e 's/html/html\/public/g' /etc/apache2/sites-available/000-default.conf\nEXPOSE 80\nCMD [\"apache2-foreground\"]",                'html' => "FROM nginx:alpine\nCOPY . /usr/share/nginx/html",
                'express' => "FROM node:18-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE {$containerPort}\nCMD [\"npm\", \"start\"]",
                'react', 'vue' => "FROM node:18-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nRUN npm run build\nFROM nginx:alpine\nCOPY --from=builder /app/dist /usr/share/nginx/html\nEXPOSE 80",
                'golang' => "FROM golang:1.21-alpine AS builder\nWORKDIR /app\nCOPY . .\nRUN go build -o main .\nFROM alpine:latest\nWORKDIR /app\nCOPY --from=builder /app/main .\nEXPOSE {$containerPort}\nCMD [\"./main\"]",
                default => "FROM nginx:alpine\nCOPY . /usr/share/nginx/html"
            };

            // Template kustom dari admin menang; {{PORT}} diganti port container.
            $dockerfileContent = $project->plan?->dockerfile
                ? str_replace('{{PORT}}', (string) $containerPort, $project->plan->dockerfile)
                : $defaultDockerfile;

            $dockerfileBase64 = base64_encode($dockerfileContent);

            // 3. Setup Docker Compose (Mengubah \\n menjadi \n untuk Base64)
            $composeContent = "services:\n  app:\n    build: .\n    container_name: app_{$project->id}\n    restart: unless-stopped\n    ports:\n      - '127.0.0.1:{$hostPort}:{$containerPort}'\n";            

            if ($project->db_type === 'mysql') {
                $composeContent .= "  db:\n    image: mysql:8.0\n    container_name: db_{$project->id}\n    restart: unless-stopped\n    ports:\n      - '0.0.0.0:{$dbPort}:3306'\n    environment:\n      MYSQL_DATABASE: {$project->db_name}\n      MYSQL_USER: {$project->db_user}\n      MYSQL_PASSWORD: {$project->db_password}\n      MYSQL_ROOT_PASSWORD: root_{$project->db_password}\n    volumes:\n      - db_data_{$project->id}:/var/lib/mysql\nvolumes:\n  db_data_{$project->id}:\n";
            } elseif ($project->db_type === 'postgresql') {
                $composeContent .= "  db:\n    image: postgres:15-alpine\n    container_name: db_{$project->id}\n    restart: unless-stopped\n    ports:\n      - '0.0.0.0:{$dbPort}:5432'\n    environment:\n      POSTGRES_DB: {$project->db_name}\n      POSTGRES_USER: {$project->db_user}\n      POSTGRES_PASSWORD: {$project->db_password}\n    volumes:\n      - db_data_{$project->id}:/var/lib/postgresql/data\nvolumes:\n  db_data_{$project->id}:\n";
            }

            $composeBase64 = base64_encode($composeContent);

            // 4. Setup Nginx Config
            $nginxConfig = "
            server {
                listen 80;
                listen 443 ssl;
                server_name {$subdomain};

                ssl_certificate /etc/letsencrypt/live/app.launchify.site/fullchain.pem;
                ssl_certificate_key /etc/letsencrypt/live/app.launchify.site/privkey.pem;

                location / {
                    proxy_pass http://127.0.0.1:{$hostPort};
                    proxy_set_header Host \$host;
                    proxy_set_header X-Real-IP \$remote_addr;
                    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
                    proxy_set_header X-Forwarded-Proto \$scheme;
                }
            }";
            
            $nginxBase64 = base64_encode($nginxConfig);

            // 5. Perintah Bash menggunakan base64 -d di seluruh file
            [$sshPrefix, $cloneUrl] = $this->resolveCloneSource($project);

            return "rm -rf {$workdir} && mkdir -p {$workdir} && cd {$workdir} && {$sshPrefix}git clone {$cloneUrl} . && cd {$appDir} && echo '{$envBase64}' | base64 -d > .env && echo '{$dockerfileBase64}' | base64 -d > Dockerfile && echo '{$composeBase64}' | base64 -d > docker-compose.yml && docker compose -p {$composeProject} build && docker compose -p {$composeProject} up -d && echo '{$nginxBase64}' | base64 -d > {$nginxConfPath} && sudo systemctl reload nginx";        
        }
        
        // Pakai deploy key juga saat pull, agar repo private tidak gagal update.
        [$pullSshPrefix] = $this->resolveCloneSource($project);

        return match($action) {
            'start' => "cd {$appDir} && docker compose -p {$composeProject} up -d && sudo systemctl reload nginx",
            'stop'  => "cd {$appDir} && docker compose -p {$composeProject} down", 
            'restart' => "cd {$appDir} && docker compose -p {$composeProject} restart",
            'update' => "cd {$workdir} && {$pullSshPrefix}git pull --ff-only && cd {$appDir} && docker compose -p {$composeProject} build && docker compose -p {$composeProject} up -d",
        };
    }
}
