<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Process;

class AdminInfrastructureController extends Controller
{
    public function index()
    {
        $containers = $this->containers();

        return response()->json([
            'host' => env('LAUNCHIFY_SERVER_IP', '129.225.33.132'),
            'memory' => $this->memory(),
            'disk' => $this->disk(),
            'containers' => $containers,
            'ports' => Project::query()
                ->whereNotNull('host_port')
                ->orderBy('host_port')
                ->get(['id', 'name', 'status', 'host_port', 'db_port'])
                ->map(fn (Project $project) => [
                    'project' => $project->name,
                    'status' => $project->status,
                    'host_port' => $project->host_port,
                    'db_port' => $project->db_port,
                ]),
            'sampled_at' => now()->toIso8601String(),
        ]);
    }

    public function stopContainer(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'regex:/^(app|db)_[0-9]+$/'],
        ]);

        $result = Process::timeout(30)->run('docker stop ' . escapeshellarg($validated['name']));

        if (!$result->successful()) {
            return response()->json([
                'message' => 'Gagal menghentikan container.',
                'error' => trim($result->errorOutput()),
            ], 500);
        }

        return response()->json([
            'message' => "Container {$validated['name']} dihentikan.",
        ]);
    }

    private function memory(): ?array
    {
        $result = Process::timeout(10)->run('free -m');
        if (!$result->successful()) {
            return null;
        }

        foreach (preg_split('/\r?\n/', $result->output()) as $line) {
            if (str_starts_with(trim($line), 'Mem:')) {
                $parts = preg_split('/\s+/', trim($line));
                $total = (int) ($parts[1] ?? 0);
                $used = (int) ($parts[2] ?? 0);
                $available = (int) ($parts[6] ?? 0);

                return [
                    'total_mb' => $total,
                    'used_mb' => $used,
                    'available_mb' => $available,
                    'percent' => $total > 0 ? round($used / $total * 100, 1) : 0,
                ];
            }
        }

        return null;
    }

    private function disk(): ?array
    {
        $result = Process::timeout(10)->run('df -kP /');
        if (!$result->successful()) {
            return null;
        }

        $lines = array_values(array_filter(preg_split('/\r?\n/', trim($result->output()))));
        if (count($lines) < 2) {
            return null;
        }

        $parts = preg_split('/\s+/', $lines[1]);
        if (count($parts) < 6) {
            return null;
        }

        return [
            'total_gb' => round(((int) $parts[1]) / 1024 / 1024, 1),
            'used_gb' => round(((int) $parts[2]) / 1024 / 1024, 1),
            'available_gb' => round(((int) $parts[3]) / 1024 / 1024, 1),
            'percent' => (float) rtrim($parts[4], '%'),
        ];
    }

    private function containers(): array
    {
        $result = Process::timeout(10)->run("docker ps --format '{{json .}}'");
        if (!$result->successful()) {
            return [];
        }

        $stats = $this->containerStats();

        $containers = [];
        foreach (preg_split('/\r?\n/', trim($result->output())) as $line) {
            if (trim($line) === '') {
                continue;
            }
            $raw = json_decode($line, true);
            if (!is_array($raw)) {
                continue;
            }

            $name = $raw['Names'] ?? '';
            $containers[] = [
                'id' => substr($raw['ID'] ?? '', 0, 12),
                'name' => $name,
                'image' => $raw['Image'] ?? '',
                'status' => $raw['Status'] ?? '',
                'state' => $raw['State'] ?? '',
                'ports' => $raw['Ports'] ?? '',
                'running_for' => $raw['RunningFor'] ?? '',
                'cpu_percent' => $stats[$name]['cpu'] ?? null,
                'mem_usage' => $stats[$name]['mem'] ?? null,
                'mem_percent' => $stats[$name]['mem_percent'] ?? null,
            ];
        }

        return $containers;
    }

    private function containerStats(): array
    {
        $result = Process::timeout(15)->run("docker stats --no-stream --format '{{json .}}'");
        if (!$result->successful()) {
            return [];
        }

        $stats = [];
        foreach (preg_split('/\r?\n/', trim($result->output())) as $line) {
            if (trim($line) === '') {
                continue;
            }
            $raw = json_decode($line, true);
            if (!is_array($raw)) {
                continue;
            }
            $stats[$raw['Name'] ?? ''] = [
                'cpu' => (float) rtrim($raw['CPUPerc'] ?? '0', '%'),
                'mem' => $raw['MemUsage'] ?? null,
                'mem_percent' => (float) rtrim($raw['MemPerc'] ?? '0', '%'),
            ];
        }

        return $stats;
    }
}
