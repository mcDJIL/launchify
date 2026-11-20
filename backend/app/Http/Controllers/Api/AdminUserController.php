<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BillingLedger;
use App\Models\TopupTransaction;
use App\Models\User;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function index()
    {
        $users = User::withCount([
            'projects',
            'projects as active_projects_count' => fn ($query) => $query->where('status', 'active'),
        ])->orderBy('name')->get();

        $topupTotals = TopupTransaction::where('status', 'approved')
            ->selectRaw('user_id, SUM(total_transfer) as total')
            ->groupBy('user_id')
            ->pluck('total', 'user_id');

        return response()->json([
            'data' => $users->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'wallet_balance' => (float) $user->wallet_balance,
                'is_suspended' => (bool) $user->is_suspended,
                'projects_count' => $user->projects_count,
                'active_projects_count' => $user->active_projects_count,
                'topup_total' => (float) ($topupTotals[$user->id] ?? 0),
                'created_at' => $user->created_at,
            ]),
        ]);
    }

    public function show(string $id)
    {
        $user = User::withCount('projects')->findOrFail($id);

        return response()->json([
            'user' => $user,
            'projects' => $user->projects()->latest()->get(['id', 'name', 'status', 'hourly_rate', 'host_port']),
            'topups' => $user->topups()->latest()->limit(20)->get(),
            'ledgers' => $user->ledgers()->latest()->limit(20)->get(),
        ]);
    }

    public function credit(Request $request, string $id)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|not_in:0',
            'note' => 'nullable|string|max:255',
        ]);

        $user = User::findOrFail($id);
        $amount = (float) $validated['amount'];
        $note = trim($validated['note'] ?? '');

        $newBalance = max(0, (float) $user->wallet_balance + $amount);
        $user->update(['wallet_balance' => $newBalance]);

        $ledger = BillingLedger::create([
            'user_id' => $user->id,
            'description' => 'Penyesuaian manual admin' . ($note !== '' ? ": {$note}" : ''),
            'amount' => abs($amount),
            'type' => $amount > 0 ? 'credit' : 'debit',
        ]);

        return response()->json([
            'message' => 'Saldo user berhasil disesuaikan.',
            'wallet_balance' => (float) $newBalance,
            'ledger' => $ledger,
        ]);
    }

    public function suspend(Request $request, string $id)
    {
        $validated = $request->validate([
            'suspended' => 'required|boolean',
        ]);

        $user = User::findOrFail($id);
        $user->update(['is_suspended' => $validated['suspended']]);

        if ($validated['suspended']) {
            $user->projects()->update(['status' => 'suspended']);
        }

        return response()->json([
            'message' => $validated['suspended'] ? 'Akun disuspend.' : 'Suspend akun dicabut.',
            'is_suspended' => (bool) $user->is_suspended,
        ]);
    }
}
