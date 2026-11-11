<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class TopupTransaction extends Model
{
    use HasUuids;

    protected $fillable = ['user_id', 'base_amount', 'unique_code', 'total_transfer', 'proof_image', 'status'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
