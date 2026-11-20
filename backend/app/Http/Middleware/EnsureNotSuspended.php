<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureNotSuspended
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Tetap izinkan logout agar user bisa membersihkan sesi.
        if ($user && $user->is_suspended && !$request->is('api/logout')) {
            return response()->json([
                'message' => 'Akun kamu sedang disuspend. Hubungi admin untuk informasi lebih lanjut.',
            ], 403);
        }

        return $next($request);
    }
}
