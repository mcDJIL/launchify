<?php

use App\Models\ProjectCron;
use Cron\CronExpression;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Schedule;

Schedule::command('billing:process-hourly')->hourly();

Schedule::call(function () {
    $crons = ProjectCron::where('is_active', true)->get();

    foreach ($crons as $cron) {
        $expression = new CronExpression($cron->schedule);

        if ($expression->isDue()) {
            $safeCmd = escapeshellarg($cron->command);
            // Flag -d menjalankan perintah di background agar tidak memblokir antrean user lain
            Process::start("docker exec -d app_{$cron->project_id} sh -c {$safeCmd}");

            $cron->update(['last_run_at' => now()]);
        }
    }
})->everyMinute();