<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaskComment extends Model
{
    public $timestamps = false;
    protected $fillable = ['task_id','user_id','comment','created_at'];
    protected function casts(): array { return ['created_at' => 'datetime']; }
    public function task() { return $this->belongsTo(Task::class); }
    public function user() { return $this->belongsTo(User::class); }
}
