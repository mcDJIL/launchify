<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Process;

class ProjectMetricsController extends Controller
{
    /**
     * Status dan pemakaian resource container aplikasi milik satu project.
     * Data diambil langsung dari Docker di host (docker inspect + docker stats).
     */
    public function show(Request $request, Project $project)
    {
        abort_if($project->user_id !== $request->user()->id, 403);

        $container = "app_{$project->id}";

        [$status, $health] = $this->inspectContainer($container);
        $stats = $status === 'running' ? $this->readStats($container) : null;

        return response()->json([
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'status' => $project->status,
                'hourly_rate' => $project->hourly_rate,
            ],
            'container' => [
                'name' => $container,
                'status' => $status,
                'health' => $health,
            ],
            'stats' => $stats,
            'sampled_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * @return array{0: string, 1: ?string} [status, health]
     */
    private function inspectContainer(string $container): array
    {
        $result = Process::timeout(10)->run(
            "docker inspect --format '{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{end}}' {$container}"
        );

        if (!$result->successful()) {
            // Container belum pernah dibuat / sudah dihapus.
            return ['not_found', null];
        }

        $parts = explode('|', trim($result->output()));

        return [$parts[0] ?: 'unknown', $parts[1] ?? null];
    }

    private function readStats(string $container): ?array
    {
        // --no-stream: ambil satu sampel, jangan streaming terus-menerus.
        $result = Process::timeout(10)->run(
            "docker stats --no-stream --format '{{json .}}' {$container}"
        );

        if (!$result->successful() || trim($result->output()) === '') {
            return null;
        }

        $raw = json_decode(trim($result->output()), true);
        if (!is_array($raw)) {
            return null;
        }

        [$memUsed, $memLimit] = array_pad(
            array_map('trim', explode('/', $raw['MemUsage'] ?? '')),
            2,
            null
        );

        return [
            'cpu_percent' => (float) rtrim($raw['CPUPerc'] ?? '0', '%'),
            'mem_percent' => (float) rtrim($raw['MemPerc'] ?? '0', '%'),
            'mem_usage' => $raw['MemUsage'] ?? null,
            'mem_used' => $memUsed,
            'mem_limit' => $memLimit,
            'net_io' => $raw['NetIO'] ?? null,
            'block_io' => $raw['BlockIO'] ?? null,
            'pids' => $raw['PIDs'] ?? null,
        ];
    }
}
