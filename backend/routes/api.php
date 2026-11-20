<?php

use App\Http\Controllers\Api\AdminBillingController;
use App\Http\Controllers\Api\AdminInfrastructureController;
use App\Http\Controllers\Api\AdminSettingsController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\BillingLedgerController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DeploymentController;
use App\Http\Controllers\Api\PlanController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\DeployKeyController;
use App\Http\Controllers\Api\ProjectDomainController;
use App\Http\Controllers\Api\ProjectEnvController;
use App\Http\Controllers\Api\ProjectMetricsController;
use App\Http\Controllers\Api\ProjectOperationController;
use App\Http\Controllers\Api\TopupTransactionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected Routes (Wajib mengirimkan header Authorization: Bearer <token>)
Route::middleware(['auth:sanctum', 'not_suspended'])->group(function () {
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
        Route::get('/admin/topups/history', [TopupTransactionController::class, 'adminHistory']);
        Route::get('/admin/infrastructure', [AdminInfrastructureController::class, 'index']);
        Route::post('/admin/containers/stop', [AdminInfrastructureController::class, 'stopContainer']);
        Route::get('/admin/billing-logs', [AdminBillingController::class, 'index']);
        Route::get('/admin/users', [AdminUserController::class, 'index']);
        Route::get('/admin/users/{user}', [AdminUserController::class, 'show']);
        Route::post('/admin/users/{user}/credit', [AdminUserController::class, 'credit']);
        Route::post('/admin/users/{user}/suspend', [AdminUserController::class, 'suspend']);
        Route::get('/admin/settings', [AdminSettingsController::class, 'index']);
        Route::put('/admin/settings', [AdminSettingsController::class, 'update']);
        Route::put('/admin/plans/{plan}', [AdminSettingsController::class, 'updatePlan']);
    });

    Route::post('/projects/{id}/deploy', [DeploymentController::class, 'trigger']);
    Route::get('/projects/{id}/logs', [DeploymentController::class, 'logs']);
    Route::get('/projects/{project}/deployments/{deployment}', [DeploymentController::class, 'showDeployment']);
    Route::get('/projects/{project}/metrics', [ProjectMetricsController::class, 'show']);
    Route::get('/projects/{project}/env', [ProjectEnvController::class, 'show']);
    Route::put('/projects/{project}/env', [ProjectEnvController::class, 'update']);
    Route::get('/projects/{project}/domains', [ProjectDomainController::class, 'index']);
    Route::post('/projects/{project}/domains', [ProjectDomainController::class, 'store']);
    Route::delete('/projects/{project}/domains/{domain}', [ProjectDomainController::class, 'destroy']);
    Route::post('/projects/{project}/domains/{domain}/verify', [ProjectDomainController::class, 'verify']);
    Route::post('/projects/{project}/domains/{domain}/ssl', [ProjectDomainController::class, 'issueSsl']);
    Route::get('/settings/ssh-keys', [DeployKeyController::class, 'index']);
    Route::post('/projects/{project}/deploy-key', [DeployKeyController::class, 'store']);
    Route::delete('/projects/{project}/deploy-key', [DeployKeyController::class, 'destroy']);

    Route::post('/projects/{project}/exec', [ProjectOperationController::class, 'execCommand']);
    Route::post('/projects/{project}/git-pull', [ProjectOperationController::class, 'gitPull']);
    Route::get('/projects/{project}/crons', [ProjectOperationController::class, 'indexCrons']);
    Route::post('/projects/{project}/crons', [ProjectOperationController::class, 'storeCron']);
    Route::patch('/projects/{project}/crons/{cron}/toggle', [ProjectOperationController::class, 'toggleCron']);
    Route::delete('/projects/{project}/crons/{cron}', [ProjectOperationController::class, 'destroyCron']);
});