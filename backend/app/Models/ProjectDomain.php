<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectDomain extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'domain',
        'dns_status',
        'ssl_status',
        'dns_verified_at',
        'ssl_issued_at',
        'last_error',
    ];

    protected $casts = [
        'dns_verified_at' => 'datetime',
        'ssl_issued_at' => 'datetime',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
