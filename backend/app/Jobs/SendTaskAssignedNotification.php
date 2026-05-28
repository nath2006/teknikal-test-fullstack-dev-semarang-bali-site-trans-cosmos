<?php

namespace App\Jobs;

use App\Models\Task;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class SendTaskAssignedNotification implements ShouldQueue
{
    use Queueable;
    public function __construct(public Task $task) {}
    public function handle(): void
    {
        $task = $this->task->load('assignee');
        if ($task->assignee) Log::info('Simulated email notification', ['task' => $task->title, 'to' => $task->assignee->email]);
    }
}
