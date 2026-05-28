<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaskAttachment extends Model
{
    public $timestamps = false;
    protected $fillable = ['task_id','file_name','file_path','thumbnail_path','file_size','mime_type','uploaded_at','version','scan_status'];
    protected function casts(): array { return ['uploaded_at' => 'datetime']; }
    public function task() { return $this->belongsTo(Task::class); }
}
