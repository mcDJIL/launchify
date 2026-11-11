<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
            'plan_id' => 'required|exists:plans,id',
            'name' => 'required|string|max:255',
            'github_url' => 'required|url',
            'docker_port' => 'required|integer|min:1024|max:65535'
        ]);

        // Status default akan otomatis 'stopped' berdasarkan struktur migration
        $project = $request->user()->projects()->create($validated);

        return response()->json([
            'message' => 'Project berhasil didaftarkan',
            'data' => $project
        ], 201);
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
            'plan_id' => 'sometimes|exists:plans,id',
            'name' => 'sometimes|string|max:255',
            'github_url' => 'sometimes|url',
            'docker_port' => 'sometimes|integer|min:1024|max:65535'
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