<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectDeployKey extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'public_key',
        'private_key_path',
        'fingerprint',
        'source',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
