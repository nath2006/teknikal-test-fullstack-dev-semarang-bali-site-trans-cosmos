<?php

namespace App\Jobs;

use App\Models\TaskAttachment;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;

class ProcessTaskAttachment implements ShouldQueue
{
    use Queueable;
    public function __construct(public TaskAttachment $attachment) {}
    public function handle(): void
    {
        $attachment = $this->attachment;
        $attachment->scan_status = str_contains(strtolower($attachment->file_name), 'virus') ? 'infected' : 'clean';
        if (str_starts_with($attachment->mime_type, 'image/')) {
            $attachment->thumbnail_path = 'public/thumbnails/' . $attachment->id . '.jpg';
            Storage::put($attachment->thumbnail_path, 'thumbnail-placeholder');
        }
        $attachment->save();
    }
}
