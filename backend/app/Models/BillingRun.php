<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BillingRun extends Model
{
    protected $fillable = [
        'run_at',
        'projects_charged',
        'total_charged',
        'projects_skipped',
        'projects_suspended',
        'notes',
    ];

    protected $casts = [
        'run_at' => 'datetime',
    ];
}
