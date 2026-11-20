<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Setting;
use Illuminate\Http\Request;

class AdminSettingsController extends Controller
{
    // Dockerfile default yang dipakai jika template belum punya dockerfile kustom.
    private const DEFAULT_DOCKERFILES = [
        'laravel' => "FROM php:8.2-apache\nRUN apt-get update && apt-get install -y libpq-dev unzip git && docker-php-ext-install pdo pdo_mysql pdo_pgsql\nRUN a2enmod rewrite\nCOPY --from=composer:latest /usr/bin/composer /usr/bin/composer\nWORKDIR /var/www/html\nCOPY . .\nRUN composer install --no-dev --optimize-autoloader\nRUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache\nRUN sed -i -e 's/html/html\\/public/g' /etc/apache2/sites-available/000-default.conf\nEXPOSE 80\nCMD [\"apache2-foreground\"]",
        'html' => "FROM nginx:alpine\nCOPY . /usr/share/nginx/html",
        'express' => "FROM node:18-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nEXPOSE {{PORT}}\nCMD [\"npm\", \"start\"]",
        'react' => "FROM node:18-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nRUN npm run build\nFROM nginx:alpine\nCOPY --from=builder /app/dist /usr/share/nginx/html\nEXPOSE 80",
        'vue' => "FROM node:18-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nRUN npm run build\nFROM nginx:alpine\nCOPY --from=builder /app/dist /usr/share/nginx/html\nEXPOSE 80",
        'golang' => "FROM golang:1.21-alpine AS builder\nWORKDIR /app\nCOPY . .\nRUN go build -o main .\nFROM alpine:latest\nWORKDIR /app\nCOPY --from=builder /app/main .\nEXPOSE {{PORT}}\nCMD [\"./main\"]",
    ];

    public function index()
    {
        $plans = Plan::orderBy('type')->orderBy('name')->get()->map(fn (Plan $plan) => [
            'id' => $plan->id,
            'code' => $plan->code,
            'name' => $plan->name,
            'type' => $plan->type,
            'price_per_hour' => (float) $plan->price_per_hour,
            'dockerfile' => $plan->dockerfile,
            'default_dockerfile' => self::DEFAULT_DOCKERFILES[$plan->code] ?? null,
        ]);

        return response()->json([
            'settings' => [
                'base_daily_rate' => (float) Setting::get('base_daily_rate', 1000),
                'max_containers_per_user' => (int) Setting::get('max_containers_per_user', 3),
            ],
            'plans' => $plans,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'base_daily_rate' => 'required|numeric|min:0|max:1000000',
            'max_containers_per_user' => 'required|integer|min:1|max:50',
        ]);

        Setting::put('base_daily_rate', $validated['base_daily_rate']);
        Setting::put('max_containers_per_user', $validated['max_containers_per_user']);

        // Samakan harga template framework dengan tarif dasar per jam.
        $hourly = round((float) $validated['base_daily_rate'] / 24, 4);
        Plan::where('type', 'framework')->update(['price_per_hour' => $hourly]);

        return response()->json([
            'message' => 'Pengaturan disimpan. Harga template framework diperbarui.',
        ]);
    }

    public function updatePlan(Request $request, Plan $plan)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price_per_hour' => 'required|numeric|min:0|max:1000000',
            'dockerfile' => 'nullable|string|max:20000',
        ]);

        $plan->update([
            'name' => $validated['name'],
            'price_per_hour' => $validated['price_per_hour'],
            'dockerfile' => $validated['dockerfile'] ?: null,
        ]);

        return response()->json([
            'message' => 'Template diperbarui.',
            'data' => $plan,
        ]);
    }
}
