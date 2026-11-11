<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BillingLedger extends Model
{
    protected $fillable = ['user_id', 'project_id', 'description', 'amount', 'type'];

    public function project() 
    {
        return $this->belongsTo(Project::class);
    }

    public function user() 
    {
        return $this->belongsTo(User::class);
    }
}
