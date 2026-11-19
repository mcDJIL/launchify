<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class BillingLedgerController extends Controller
{
    /**
     * Riwayat mutasi saldo user (top-up masuk dan potongan per jam)
     * beserta ringkasan saldo dan estimasi runway.
     */
    public function history(Request $request)
    {
        $user = $request->user();

        $ledgers = $user->ledgers()
            ->with('project:id,name')
            ->latest()
            ->limit(100)
            ->get();

        $activeProjects = $user->projects()
            ->where('status', 'active')
            ->get(['id', 'name', 'hourly_rate']);

        $hourlyBurn = (float) $activeProjects->sum(fn ($project) => (float) $project->hourly_rate);
        $balance = (float) $user->wallet_balance;

        return response()->json([
            'data' => $ledgers,
            'summary' => [
                'wallet_balance' => $balance,
                'active_projects' => $activeProjects->count(),
                'hourly_burn' => $hourlyBurn,
                // null artinya tidak ada project aktif, jadi saldo tidak berkurang per jam.
                'runway_hours' => $hourlyBurn > 0 ? $balance / $hourlyBurn : null,
            ],
        ]);
    }
}
