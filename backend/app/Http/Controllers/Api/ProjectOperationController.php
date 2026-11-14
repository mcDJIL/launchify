<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectCron;
use Cron\CronExpression;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Process;

class ProjectOperationController extends Controller
{
    // 1. Web Console: Jalankan perintah satu kali di dalam container (Migrate, Seeder, dll)
    public function execCommand(Request $request, Project $project)
    {
        abort_if($project->user_id !== $request->user()->id, 403);

        $validated = $request->validate([
            'command' => 'required|string|max:500',
        ]);

        $safeCmd = escapeshellarg($validated['command']);
        $process = Process::timeout(120)->run(
            "docker exec app_{$project->id} sh -c {$safeCmd}"
        );

        return response()->json([
            'success' => $process->successful(),
            'exit_code' => $process->exitCode(),
            'output' => $process->output() . $process->errorOutput(),
        ]);
    }

    // 2. List Cron Jobs milik Project
    public function indexCrons(Request $request, Project $project)
    {
        abort_if($project->user_id !== $request->user()->id, 403);
        return response()->json($project->crons()->latest()->get());
    }

    // 3. Tambah Cron Job baru
    public function storeCron(Request $request, Project $project)
    {
        abort_if($project->user_id !== $request->user()->id, 403);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'schedule' => [
                'required',
                'string',
                function ($attribute, $value, $fail) {
                    if (!CronExpression::isValidExpression($value)) {
                        $fail('Format jadwal cron tidak valid (contoh valid: * * * * *).');
                    }
                },
            ],
            'command' => 'required|string|max:255',
        ]);

        $cron = $project->crons()->create($validated);

        return response()->json($cron, 201);
    }

    // 4. Aktifkan / Nonaktifkan Cron Job
    public function toggleCron(Request $request, Project $project, ProjectCron $cron)
    {
        abort_if($project->user_id !== $request->user()->id || $cron->project_id !== $project->id, 403);

        $cron->update(['is_active' => !$cron->is_active]);

        return response()->json($cron);
    }

    // 5. Hapus Cron Job
    public function destroyCron(Request $request, Project $project, ProjectCron $cron)
    {
        abort_if($project->user_id !== $request->user()->id || $cron->project_id !== $project->id, 403);

        $cron->delete();

        return response()->json(['message' => 'Cron job berhasil dihapus']);
    }
}