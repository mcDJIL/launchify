<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'plan_id', 'name', 'github_url', 'docker_port', 'status', 'db_type', 'db_name', 'db_user', 'db_password', 'framework', 'custom_env', 'host_port', 'hourly_rate'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    public function deployments()
    {
        return $this->hasMany(Deployment::class);
    }
}
