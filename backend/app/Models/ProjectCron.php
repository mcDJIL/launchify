<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectCron extends Model
{
    protected $fillable = [
        'project_id', 'name', 'schedule', 'command', 'is_active', 'last_run_at'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_run_at' => 'datetime',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}