<?php

namespace App\Jobs;

use App\Models\Task;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;

class ExportTasksReport implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $path,
        public array $filters = []
    ) {
    }

    public function handle(): void
    {
        $rows = Task::query()
            ->with(['assignee:id,name,email', 'creator:id,name,email'])
            ->when($this->filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($this->filters['priority'] ?? null, fn ($query, $priority) => $query->where('priority', $priority))
            ->latest()
            ->get()
            ->map(fn (Task $task) => [
                $task->id,
                $task->title,
                $task->status,
                $task->priority,
                $task->assignee?->name,
                $task->creator?->name,
                optional($task->due_date)->toDateString(),
                $task->created_at->toDateTimeString(),
            ]);

        $csv = collect([
            ['id', 'title', 'status', 'priority', 'assignee', 'creator', 'due_date', 'created_at'],
        ])->merge($rows)->map(function (array $row) {
            return collect($row)
                ->map(fn ($value) => '"' . str_replace('"', '""', (string) $value) . '"')
                ->implode(',');
        })->implode(PHP_EOL);

        Storage::put($this->path, $csv . PHP_EOL);
    }
}
