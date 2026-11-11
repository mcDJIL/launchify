<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TopupTransaction extends Model
{
    use HasUuids, HasFactory;

    protected $fillable = ['user_id', 'base_amount', 'unique_code', 'total_transfer', 'proof_image', 'status'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
