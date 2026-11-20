<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Process;
use Illuminate\Validation\ValidationException;

class ProjectEnvController extends Controller
{
    // Framework yang membaca .env saat runtime, jadi bisa disuntik tanpa rebuild.
    private const RUNTIME_ENV_FRAMEWORKS = ['laravel', 'express', 'golang'];

    public function show(Request $request, Project $project)
    {
        abort_if($project->user_id !== $request->user()->id, 403);

        return response()->json([
            'env' => $project->custom_env ?? '',
            'db_env' => $this->databaseEnv($project),
            'supports_hot_reload' => in_array($project->framework, self::RUNTIME_ENV_FRAMEWORKS, true),
            'container_running' => $project->status === 'active',
            'framework' => $project->framework,
        ]);
    }

    public function update(Request $request, Project $project)
    {
        abort_if($project->user_id !== $request->user()->id, 403);

        $validated = $request->validate([
            'env' => 'nullable|string|max:20000',
        ]);

        $env = $this->normalizeEnv($validated['env'] ?? '');
        $project->update(['custom_env' => $env]);

        $message = 'Environment variables disimpan.';
        $applied = false;

        if ($project->status === 'active') {
            if (!in_array($project->framework, self::RUNTIME_ENV_FRAMEWORKS, true)) {
                $message .= ' Framework ini menyimpan env saat build, jadi lakukan Rebuild agar perubahan berlaku.';
            } elseif ($this->injectToContainer($project)) {
                $applied = true;
                $message .= ' Variabel sudah disuntik ulang dan container direstart.';
            } else {
                $message .= ' Namun gagal menyuntik ke container. Coba Rebuild atau cek status container.';
            }
        }

        return response()->json([
            'message' => $message,
            'applied' => $applied,
            'env' => $env,
        ]);
    }

    /**
     * Validasi format baris .env (KEY=VALUE), buang komentar dan baris kosong.
     */
    private function normalizeEnv(string $raw): string
    {
        $lines = preg_split('/\r\n|\r|\n/', $raw);
        $result = [];
        $seen = [];

        foreach ($lines as $index => $line) {
            $line = trim($line);

            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }

            if (!preg_match('/^([A-Za-z_][A-Za-z0-9_]*)\s*=/', $line, $matches)) {
                throw ValidationException::withMessages([
                    'env' => "Baris " . ($index + 1) . " tidak valid. Gunakan format KEY=VALUE.",
                ]);
            }

            $key = $matches[1];
            if (isset($seen[$key])) {
                throw ValidationException::withMessages([
                    'env' => "Key {$key} ditulis lebih dari sekali.",
                ]);
            }
            $seen[$key] = true;

            $result[] = $line;
        }

        return implode("\n", $result);
    }

    private function databaseEnv(Project $project): string
    {
        if ($project->db_type === 'mysql') {
            return "DB_CONNECTION=mysql\nDB_HOST=db\nDB_PORT=3306\nDB_DATABASE={$project->db_name}\nDB_USERNAME={$project->db_user}\nDB_PASSWORD={$project->db_password}";
        }

        if ($project->db_type === 'postgresql') {
            return "DB_CONNECTION=pgsql\nDB_HOST=db\nDB_PORT=5432\nDB_DATABASE={$project->db_name}\nDB_USERNAME={$project->db_user}\nDB_PASSWORD={$project->db_password}";
        }

        return '';
    }

    /**
     * Tulis .env lengkap (custom + DB otomatis) ke dalam container lalu restart.
     */
    private function injectToContainer(Project $project): bool
    {
        $container = "app_{$project->id}";
        $workdir = match ($project->framework) {
            'laravel' => '/var/www/html',
            default => '/app',
        };

        $content = trim(($project->custom_env ?? '') . "\n\n# Auto-Injected Database\n" . $this->databaseEnv($project));
        $encoded = base64_encode($content);
        $path = "{$workdir}/.env";

        $write = Process::timeout(20)->run(
            "docker exec {$container} sh -c \"echo '{$encoded}' | base64 -d > {$path}\""
        );

        if (!$write->successful()) {
            return false;
        }

        $restart = Process::timeout(60)->run("docker restart {$container}");

        return $restart->successful();
    }
}
