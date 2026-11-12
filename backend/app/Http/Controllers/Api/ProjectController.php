<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Project;
use Illuminate\Http\Request;

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
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'github_url' => 'required|url',
            'docker_port' => 'required|integer|min:1024|max:65535',
            'db_type' => 'required|string|exists:plans,code',
            'db_name' => 'required|string|max:255',
            'db_user' => 'required|string|max:255',
            'db_password' => 'required|string|max:255',
            'framework' => 'required|string|exists:plans,code',
            'custom_env' => 'nullable|string',
            'host_port' => 'nullable|integer|min:1024|max:65535',
            'status' => 'nullable|in:active,suspended,stopped'
        ]);

        $frameworkPlan = Plan::where('type', 'framework')->where('code', $request->framework)->first();
        $dbPlan = Plan::where('type', 'database')->where('code', $request->db_type)->first();

        if (!$frameworkPlan || !$dbPlan) {
            return response()->json(['message' => 'Framework atau database tidak valid'], 422);
        }

        $basePrice = $frameworkPlan ? $frameworkPlan->price_per_hour : 100;
        $dbPrice = $dbPlan ? $dbPlan->price_per_hour : 0;
        
        $hourlyRate = $basePrice + $dbPrice;

        $project = $request->user()->projects()->create([
            'plan_id' => $frameworkPlan->id,
            'name' => $request->name,
            'github_url' => $request->github_url,
            'docker_port' => $request->docker_port,
            'framework' => $request->framework,
            'db_type' => $request->db_type,
            'db_name' => $request->db_name,
            'db_user' => $request->db_user,
            'db_password' => $request->db_password,
            'custom_env' => $request->custom_env,
            'host_port' => $request->host_port,
            'hourly_rate' => $hourlyRate, // Simpan hasil kalkulasi di sini
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
            'docker_port' => 'sometimes|integer|min:1024|max:65535',
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
        $project->delete();

        return response()->json(['message' => 'Project berhasil dihapus']);
    }
}
