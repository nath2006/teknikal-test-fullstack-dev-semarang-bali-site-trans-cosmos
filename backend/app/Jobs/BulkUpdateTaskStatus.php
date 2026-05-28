<?php

namespace App\Jobs;

use App\Models\Task;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class BulkUpdateTaskStatus implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public array $taskIds,
        public string $status,
        public int $requestedBy
    ) {
    }

    public function handle(): void
    {
        $updated = Task::query()
            ->whereIn('id', $this->taskIds)
            ->update([
                'status' => $this->status,
                'updated_at' => now(),
            ]);

        Log::info('Bulk task status update completed', [
            'status' => $this->status,
            'updated' => $updated,
            'requested_by' => $this->requestedBy,
        ]);
    }
}
