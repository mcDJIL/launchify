<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    public function index()
    {
        // Menampilkan semua pilihan spesifikasi server yang tersedia
        return response()->json(Plan::all());
    }

    public function show(Plan $plan)
    {
        return response()->json($plan);
    }

    public function store(Request $request)
    {
        // Opsional: Pastikan ini nanti dilindungi middleware khusus Admin
        $validated = $request->validate([
            'name' => 'required|string|unique:plans',
            'ram_mb' => 'required|integer',
            'cpu_cores' => 'required|integer',
            'storage_gb' => 'required|integer',
            'price_per_hour' => 'required|numeric'
        ]);

        $plan = Plan::create($validated);
        return response()->json(['message' => 'Plan created', 'data' => $plan], 201);
    }
}