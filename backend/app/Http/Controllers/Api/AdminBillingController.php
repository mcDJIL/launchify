<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BillingLedger;
use App\Models\BillingRun;
use App\Models\TopupTransaction;
use App\Models\User;

class AdminBillingController extends Controller
{
    public function index()
    {
        $approved = TopupTransaction::where('status', 'approved')->get(['total_transfer', 'created_at']);
        $totalIncome = (float) $approved->sum('total_transfer');

        $monthly = $approved
            ->groupBy(fn ($topup) => $topup->created_at?->format('Y-m'))
            ->map(fn ($rows, $month) => [
                'month' => $month,
                'total' => (float) $rows->sum('total_transfer'),
                'count' => $rows->count(),
            ])
            ->filter(fn ($row) => $row['month'] !== null)
            ->sortKeysDesc()
            ->values();

        $userCount = User::count();
        $currentMonth = now()->format('Y-m');

        return response()->json([
            'summary' => [
                'total_income' => $totalIncome,
                'total_debits' => (float) BillingLedger::where('type', 'debit')->sum('amount'),
                'current_month_income' => (float) $approved
                    ->filter(fn ($topup) => $topup->created_at?->format('Y-m') === $currentMonth)
                    ->sum('total_transfer'),
                'users' => $userCount,
                'arpu' => $userCount > 0 ? round($totalIncome / $userCount, 2) : 0,
            ],
            'monthly' => $monthly,
            'runs' => BillingRun::latest('run_at')->limit(50)->get(),
        ]);
    }
}
