<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectDomain;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Process;

class ProjectDomainController extends Controller
{
    private function serverIp(): string
    {
        return env('LAUNCHIFY_SERVER_IP', '129.225.33.132');
    }

    private function nginxConfigPath(Project $project, ProjectDomain $domain): string
    {
        return "/var/www/paas_projects/nginx_configs/{$project->id}_domain_{$domain->id}.conf";
    }

    public function index(Request $request, Project $project)
    {
        abort_if($project->user_id !== $request->user()->id, 403);

        $cleanName = strtolower(preg_replace('/[^a-zA-Z0-9-]/', '', $project->name));

        return response()->json([
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'status' => $project->status,
            ],
            'domains' => $project->domains()->latest()->get(),
            'default_subdomain' => "{$cleanName}.app.launchify.site",
            'server_ip' => $this->serverIp(),
            'host_port' => $project->host_port,
        ]);
    }

    public function store(Request $request, Project $project)
    {
        abort_if($project->user_id !== $request->user()->id, 403);

        $validated = $request->validate([
            'domain' => 'required|string|max:253',
        ]);

        $domain = strtolower(trim($validated['domain']));
        $domain = preg_replace('#^https?://#', '', $domain);
        $domain = rtrim($domain, '/');

        if (
            !preg_match('/^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/', $domain)
        ) {
            return response()->json([
                'message' => 'Format domain tidak valid. Contoh: app.namadomain.com',
            ], 422);
        }

        if (str_ends_with($domain, '.app.launchify.site')) {
            return response()->json([
                'message' => 'Subdomain Launchify sudah tersedia otomatis, tidak perlu didaftarkan.',
            ], 422);
        }

        if (ProjectDomain::where('domain', $domain)->exists()) {
            return response()->json([
                'message' => 'Domain ini sudah terdaftar pada project lain.',
            ], 422);
        }

        if ($project->domains()->count() >= 5) {
            return response()->json([
                'message' => 'Maksimal 5 custom domain per project.',
            ], 422);
        }

        $created = $project->domains()->create([
            'domain' => $domain,
            'dns_status' => 'pending',
            'ssl_status' => 'none',
        ]);

        return response()->json([
            'message' => 'Domain ditambahkan. Atur A Record lalu jalankan cek DNS.',
            'data' => $created,
        ], 201);
    }

    public function destroy(Request $request, Project $project, ProjectDomain $domain)
    {
        abort_if($project->user_id !== $request->user()->id || $domain->project_id !== $project->id, 403);

        $path = $this->nginxConfigPath($project, $domain);
        if (is_file($path)) {
            @unlink($path);
            Process::timeout(20)->run('sudo systemctl reload nginx');
        }

        $domain->delete();

        return response()->json(['message' => 'Domain dihapus.']);
    }

    public function verify(Request $request, Project $project, ProjectDomain $domain)
    {
        abort_if($project->user_id !== $request->user()->id || $domain->project_id !== $project->id, 403);

        $resolvedIp = $this->resolveIp($domain->domain);
        $expectedIp = $this->serverIp();

        if ($resolvedIp !== $expectedIp) {
            $domain->update([
                'dns_status' => 'failed',
                'last_error' => $resolvedIp
                    ? "A Record mengarah ke {$resolvedIp}, seharusnya {$expectedIp}."
                    : "Domain belum mengarah ke {$expectedIp}. Propagasi DNS bisa memakan waktu hingga 24 jam.",
            ]);

            return response()->json([
                'message' => $domain->last_error,
                'data' => $domain,
            ], 422);
        }

        if (!$project->host_port) {
            return response()->json([
                'message' => 'Jalankan build project terlebih dahulu agar port aplikasi tersedia.',
            ], 422);
        }

        $written = $this->writeNginxConfig($project, $domain);
        if (!$written) {
            return response()->json([
                'message' => 'DNS sudah benar, tetapi gagal menulis konfigurasi nginx.',
            ], 500);
        }

        $domain->update([
            'dns_status' => 'verified',
            'dns_verified_at' => now(),
            'last_error' => null,
        ]);

        return response()->json([
            'message' => 'DNS terverifikasi. Nginx sudah diarahkan ke aplikasi. Lanjut terbitkan SSL.',
            'data' => $domain,
        ]);
    }

    public function issueSsl(Request $request, Project $project, ProjectDomain $domain)
    {
        abort_if($project->user_id !== $request->user()->id || $domain->project_id !== $project->id, 403);

        if ($domain->dns_status !== 'verified') {
            return response()->json([
                'message' => 'Verifikasi DNS terlebih dahulu sebelum menerbitkan SSL.',
            ], 422);
        }

        $domain->update(['ssl_status' => 'pending', 'last_error' => null]);

        $safeDomain = escapeshellarg($domain->domain);
        $email = env('CERTBOT_EMAIL');
        $emailFlag = $email ? '-m ' . escapeshellarg($email) : '--register-unsafely-without-email';

        $result = Process::timeout(180)->run(
            "sudo certbot --nginx -d {$safeDomain} --non-interactive --agree-tos {$emailFlag} --redirect"
        );

        if (!$result->successful()) {
            $error = trim($result->errorOutput() . "\n" . $result->output());
            $domain->update([
                'ssl_status' => 'failed',
                'last_error' => mb_substr($error ?: 'Certbot gagal menerbitkan sertifikat.', 0, 1000),
            ]);

            return response()->json([
                'message' => 'Gagal menerbitkan SSL. Periksa pesan error Certbot.',
                'data' => $domain,
            ], 500);
        }

        $domain->update([
            'ssl_status' => 'issued',
            'ssl_issued_at' => now(),
            'last_error' => null,
        ]);

        return response()->json([
            'message' => 'SSL berhasil diterbitkan. Domain sudah bisa diakses via https.',
            'data' => $domain,
        ]);
    }

    private function resolveIp(string $host): ?string
    {
        try {
            $records = @dns_get_record($host, DNS_A);
        } catch (\Throwable $e) {
            $records = [];
        }

        foreach ((array) $records as $record) {
            if (!empty($record['ip'])) {
                return $record['ip'];
            }
        }

        $fallback = @gethostbyname($host);

        return $fallback !== $host ? $fallback : null;
    }

    private function writeNginxConfig(Project $project, ProjectDomain $domain): bool
    {
        $config = "server {\n"
            . "    listen 80;\n"
            . "    server_name {$domain->domain};\n\n"
            . "    location / {\n"
            . "        proxy_pass http://127.0.0.1:{$project->host_port};\n"
            . "        proxy_set_header Host \$host;\n"
            . "        proxy_set_header X-Real-IP \$remote_addr;\n"
            . "        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;\n"
            . "        proxy_set_header X-Forwarded-Proto \$scheme;\n"
            . "    }\n"
            . "}\n";

        $path = $this->nginxConfigPath($project, $domain);
        $dir = dirname($path);

        if (!is_dir($dir) && !@mkdir($dir, 0755, true)) {
            return false;
        }

        if (@file_put_contents($path, $config) === false) {
            return false;
        }

        return Process::timeout(20)->run('sudo systemctl reload nginx')->successful();
    }
}
