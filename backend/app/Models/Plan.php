<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $fillable = ['name', 'ram_mb', 'cpu_cores', 'storage_gb', 'price_per_hour'];
}
