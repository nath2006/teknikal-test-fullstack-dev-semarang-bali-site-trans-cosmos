<?php

namespace Database\Seeders;

use App\Models\Task;
use App\Models\TaskComment;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $roles = ['admin','manager','member','member','member'];
        $users = collect(range(1, 5))->map(fn($i) => User::create([
            'name' => "Demo User {$i}", 'email' => "user{$i}@example.com", 'password' => Hash::make('password'), 'role' => $roles[$i - 1],
        ]));
        $statuses = ['todo','in_progress','review','done']; $priorities = ['low','medium','high','urgent'];
        $tasks = collect(range(1, 15))->map(fn($i) => Task::create([
            'title' => "Task {$i}: Improve workflow", 'description' => "Sample task {$i} for dashboard testing.",
            'status' => $statuses[$i % 4], 'priority' => $priorities[$i % 4],
            'assigned_user_id' => $users[$i % 5]->id, 'created_by' => $users[0]->id,
            'due_date' => now()->addDays($i)->toDateString(),
        ]));
        range(1, 10); foreach (range(1, 10) as $i) TaskComment::create([
            'task_id' => $tasks[$i % 15]->id, 'user_id' => $users[$i % 5]->id,
            'comment' => "Comment {$i}: please review the latest update.", 'created_at' => now()->subHours($i),
        ]);
    }
}
