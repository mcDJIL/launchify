<?php

use App\Http\Controllers\Api\BillingLedgerController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DeploymentController;
use App\Http\Controllers\Api\PlanController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\ProjectOperationController;
use App\Http\Controllers\Api\TopupTransactionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected Routes (Wajib mengirimkan header Authorization: Bearer <token>)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);

    Route::apiResource('plans', PlanController::class)->only(['index', 'show']);
    Route::apiResource('projects', ProjectController::class);

    Route::post('/topup/request', [TopupTransactionController::class, 'requestTopup']);
    Route::get('/topup/history', [TopupTransactionController::class, 'history']);
    Route::get('/billing/history', [BillingLedgerController::class, 'history']);
    Route::post('/topup/{id}/upload-proof', [TopupTransactionController::class, 'uploadProof']);

    Route::middleware(['auth:sanctum', 'admin'])->group(function () {
        Route::get('/admin/topups', function () {
            return \App\Models\TopupTransaction::where('status', 'verifying')->with('user')->get();
        });

        Route::post('/topup/{id}/approve', [TopupTransactionController::class, 'approve']);
        Route::post('/topup/{id}/reject', [TopupTransactionController::class, 'reject']);
    });

    Route::post('/projects/{id}/deploy', [DeploymentController::class, 'trigger']);
    Route::get('/projects/{id}/logs', [DeploymentController::class, 'logs']);

    Route::post('/projects/{project}/exec', [ProjectOperationController::class, 'execCommand']);
    Route::get('/projects/{project}/crons', [ProjectOperationController::class, 'indexCrons']);
    Route::post('/projects/{project}/crons', [ProjectOperationController::class, 'storeCron']);
    Route::patch('/projects/{project}/crons/{cron}/toggle', [ProjectOperationController::class, 'toggleCron']);
    Route::delete('/projects/{project}/crons/{cron}', [ProjectOperationController::class, 'destroyCron']);
});