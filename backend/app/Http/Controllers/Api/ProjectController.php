<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Project;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Process;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        // Hanya mengambil project milik user yang sedang login beserta relasi plan-nya
        $projects = $request->user()->projects()->with('plan')->get();
        return response()->json($projects);
    }

    public function store(Request $request)
    {
        $maxContainers = (int) Setting::get('max_containers_per_user', 3);
        if ($request->user()->projects()->count() >= $maxContainers) {
            return response()->json([
                'message' => "Batas maksimal {$maxContainers} container per user sudah tercapai.",
            ], 422);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'github_url' => 'required|url',
            'docker_port' => 'required|integer|min:1|max:65535',
            'db_type' => 'required|string|exists:plans,code',
            'db_name' => 'nullable|required_unless:db_type,none|string|max:255',
            'db_user' => 'nullable|required_unless:db_type,none|string|max:255',
            'db_password' => 'nullable|required_unless:db_type,none|string|max:255',
            'framework' => 'required|string|exists:plans,code',
            'root_directory' => ['nullable', 'string', 'max:255', 'regex:/^[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/', 'not_regex:/(^|\/)\.\.(\/|$)/'],
            'custom_env' => 'nullable|string',
            'host_port' => 'nullable|integer|min:1024|max:65535',
            'status' => 'nullable|in:active,suspended,stopped'
        ]);

        $frameworkPlan = Plan::where('type', 'framework')->where('code', $request->framework)->first();
        $dbType = $validated['db_type'] ?? 'none';
        $dbPlan = Plan::where('type', 'database')
            ->where('code', $dbType)
            ->first();

        if (!$frameworkPlan || !$dbPlan) {
            return response()->json(['message' => 'Framework atau database tidak valid'], 422);
        }

        $totalHourlyRate = ($frameworkPlan ? (float) $frameworkPlan->price_per_hour : 41.6667)
                     + ($dbPlan ? (float) $dbPlan->price_per_hour : 0);

        $project = $request->user()->projects()->create([
            'user_id' => $request->user()->id,
            'plan_id' => $frameworkPlan->id,
            'name' => $request->name,
            'github_url' => $request->github_url,
            'root_directory' => $request->root_directory,
            'release_command' => $request->release_command,
            'docker_port' => $request->docker_port,
            'framework' => $request->framework,
            'db_type' => $request->db_type,
            'db_name' => $request->db_name,
            'db_user' => $request->db_user,
            'db_password' => $request->db_password,
            'custom_env' => $request->custom_env,
            'host_port' => $request->host_port,
            'hourly_rate' => $totalHourlyRate, // Simpan hasil kalkulasi di sini
            'status' => 'stopped'
        ]);

        return response()->json(['message' => 'Project berhasil dibuat', 'data' => $project], 201);
    }

    public function show(Request $request, string $id)
    {
        // Validasi kepemilikan
        $project = $request->user()->projects()->with(['plan', 'deployments'])->findOrFail($id);
        return response()->json($project);
    }

    public function update(Request $request, string $id)
    {
        $project = $request->user()->projects()->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'github_url' => 'sometimes|url',
            'docker_port' => 'sometimes|integer|min:1|max:65535',
            'host_port' => 'sometimes|integer|min:1024|max:65535'
        ]);

        $project->update($validated);

        return response()->json([
            'message' => 'Project berhasil diperbarui',
            'data' => $project
        ]);
    }

    public function destroy(Request $request, string $id)
    {
        $project = $request->user()->projects()->findOrFail($id);

        $workdir = "/var/www/paas_projects/project_{$project->id}";
        $composeProject = "project_{$project->id}";
        $nginxConf = "/var/www/paas_projects/nginx_configs/{$project->id}.conf";

        // Hentikan dan hapus container + volume database project.
        if (is_dir($workdir)) {
            Process::timeout(180)->run("cd {$workdir} && docker compose -p {$composeProject} down -v --remove-orphans");
        }
        // Pastikan container sisa (kalau folder sudah hilang) ikut dibersihkan.
        Process::timeout(60)->run("docker rm -f app_{$project->id} db_{$project->id}");

        // Hapus folder kerja, konfigurasi nginx, dan private key deploy.
        Process::timeout(60)->run('rm -rf ' . escapeshellarg($workdir) . ' ' . escapeshellarg($nginxConf));

        $deployKey = $project->deployKey;
        if ($deployKey && $deployKey->private_key_path) {
            Process::timeout(30)->run('rm -f ' . escapeshellarg($deployKey->private_key_path));
        }

        Process::timeout(60)->run('sudo systemctl reload nginx');

        $project->delete();

        return response()->json(['message' => 'Project berhasil dihapus']);
    }
}
