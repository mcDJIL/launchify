<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Deployment extends Model
{
    protected $fillable = ['project_id', 'action', 'status', 'log_output', 'duration_seconds'];

    public function project() 
    {
        return $this->belongsTo(Project::class);
    }
}
