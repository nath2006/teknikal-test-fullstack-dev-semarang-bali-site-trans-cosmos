<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    protected $fillable = ['name', 'email', 'password', 'role'];
    protected $hidden = ['password', 'remember_token'];
    protected function casts(): array { return ['password' => 'hashed']; }
    public function getJWTIdentifier() { return $this->getKey(); }
    public function getJWTCustomClaims(): array { return ['role' => $this->role]; }
    public function assignedTasks() { return $this->hasMany(Task::class, 'assigned_user_id'); }
    public function createdTasks() { return $this->hasMany(Task::class, 'created_by'); }
}
