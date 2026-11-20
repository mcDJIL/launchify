<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Process;

class DeployKeyController extends Controller
{
    /**
     * Daftar project user beserta status deploy key-nya.
     * Private key tidak pernah dikirim ke frontend.
     */
    public function index(Request $request)
    {
        $projects = $request->user()->projects()
            ->with('deployKey')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $projects->map(fn (Project $project) => $this->present($project)),
        ]);
    }

    public function store(Request $request, Project $project)
    {
        abort_if($project->user_id !== $request->user()->id, 403);

        $validated = $request->validate([
            'regenerate' => 'boolean',
            'private_key' => 'nullable|string|max:10000',
        ]);

        $privateKey = trim($validated['private_key'] ?? '');
        $regenerate = $request->boolean('regenerate') || $privateKey !== '';

        if ($project->deployKey && !$regenerate) {
            return response()->json([
                'message' => 'Deploy key sudah ada. Gunakan regenerate jika ingin membuat ulang.',
                'data' => $this->present($project->fresh('deployKey')),
            ]);
        }

        // Hapus key lama (file + record) sebelum membuat yang baru.
        $this->removeKey($project);
        $project->unsetRelation('deployKey');

        $dir = storage_path('app/private/ssh');
        if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
            return response()->json([
                'message' => 'Folder penyimpanan SSH key tidak bisa dibuat.',
            ], 500);
        }

        $path = "{$dir}/project_{$project->id}_ed25519";
        $source = $privateKey !== '' ? 'uploaded' : 'generated';

        if ($source === 'uploaded') {
            $publicKey = $this->importPrivateKey($path, $privateKey);
            if ($publicKey === null) {
                return response()->json([
                    'message' => 'Private key tidak valid atau memakai passphrase. Buat key tanpa passphrase lalu tempel ulang.',
                ], 422);
            }
            @file_put_contents("{$path}.pub", $publicKey . "\n");
        } else {
            $comment = "launchify-project-{$project->id}";
            $result = Process::timeout(30)->run(
                'ssh-keygen -t ed25519 -C ' . escapeshellarg($comment)
                . ' -f ' . escapeshellarg($path) . ' -N ""'
            );

            if (!$result->successful() || !is_file("{$path}.pub")) {
                return response()->json([
                    'message' => 'Gagal membuat SSH key. Pastikan ssh-keygen tersedia di server.',
                    'error' => trim($result->errorOutput()),
                ], 500);
            }

            $publicKey = trim((string) file_get_contents("{$path}.pub"));
        }

        @chmod($path, 0600);
        @chmod("{$path}.pub", 0644);

        $fingerprintResult = Process::timeout(10)->run('ssh-keygen -lf ' . escapeshellarg("{$path}.pub"));

        $deployKey = $project->deployKey()->create([
            'public_key' => $publicKey,
            'private_key_path' => $path,
            'fingerprint' => $fingerprintResult->successful()
                ? trim(explode(' ', trim($fingerprintResult->output()))[1] ?? '')
                : null,
            'source' => $source,
        ]);

        return response()->json([
            'message' => $source === 'uploaded'
                ? 'Key milikmu tersimpan. Public key di bawah siap ditempel ke GitHub repo.'
                : 'Deploy key dibuat. Salin public key ke GitHub repo (Settings → Deploy keys).',
            'data' => $this->present($project->fresh('deployKey')),
            'public_key' => $deployKey->public_key,
        ], 201);
    }

    /**
     * Simpan private key dari user lalu turunkan public key-nya.
     * Mengembalikan null jika key tidak valid / memakai passphrase.
     */
    private function importPrivateKey(string $path, string $privateKey): ?string
    {
        $normalized = str_replace("\r\n", "\n", $privateKey) . "\n";

        if (!str_contains($normalized, 'PRIVATE KEY-----')) {
            return null;
        }

        if (@file_put_contents($path, $normalized) === false) {
            return null;
        }

        @chmod($path, 0600);

        // -P '' memastikan key berpassphrase langsung gagal, bukan menunggu input.
        $result = Process::timeout(10)->run(
            'ssh-keygen -y -P "" -f ' . escapeshellarg($path)
        );

        if (!$result->successful()) {
            @unlink($path);
            return null;
        }

        $publicKey = trim($result->output());
        if (!preg_match('/^(ssh-ed25519|ssh-rsa|ecdsa-sha2-)\S+\s+\S+/', $publicKey)) {
            @unlink($path);
            return null;
        }

        return $publicKey;
    }

    public function destroy(Request $request, Project $project)
    {
        abort_if($project->user_id !== $request->user()->id, 403);

        $this->removeKey($project);

        return response()->json([
            'message' => 'Deploy key dihapus. Jangan lupa hapus juga di pengaturan GitHub.',
        ]);
    }

    private function removeKey(Project $project): void
    {
        $key = $project->deployKey;
        if (!$key) {
            return;
        }

        @unlink($key->private_key_path);
        @unlink("{$key->private_key_path}.pub");
        $key->delete();
    }

    private function present(Project $project): array
    {
        $key = $project->deployKey;

        return [
            'project_id' => $project->id,
            'name' => $project->name,
            'framework' => $project->framework,
            'github_url' => $project->github_url,
            'status' => $project->status,
            'has_key' => (bool) $key,
            'public_key' => $key?->public_key,
            'fingerprint' => $key?->fingerprint,
            'source' => $key?->source,
            'created_at' => $key?->created_at,
        ];
    }
}
