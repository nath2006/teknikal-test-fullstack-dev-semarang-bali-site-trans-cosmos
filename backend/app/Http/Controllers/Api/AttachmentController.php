<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessTaskAttachment;
use App\Models\Task;
use App\Models\TaskAttachment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AttachmentController extends Controller
{
    public function store(Request $request, Task $task): JsonResponse
    {
        $this->authorizeTaskAccess($task);

        $data = $request->validate([
            'file' => [
                'required',
                'file',
                'max:102400',
                'mimes:jpg,jpeg,png,webp,pdf,doc,docx,xls,xlsx,mp4,webm',
            ],
        ]);

        $file = $data['file'];

        $version = TaskAttachment::where('task_id', $task->id)
            ->where('file_name', $file->getClientOriginalName())
            ->max('version') + 1;

        $path = $file->store("private/task-attachments/{$task->id}");

        $attachment = TaskAttachment::create([
            'task_id' => $task->id,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'version' => $version,
            'uploaded_at' => now(),
            'scan_status' => 'pending',
        ]);

        ProcessTaskAttachment::dispatch($attachment);

        $task->touch();

        return response()->json($attachment, 201);
    }

    public function download(TaskAttachment $attachment)
    {
        $this->authorizeTaskAccess($attachment->task);

        abort_unless(Storage::exists($attachment->file_path), 404);

        return Storage::download($attachment->file_path, $attachment->file_name);
    }

    public function destroy(TaskAttachment $attachment): JsonResponse
    {
        $user = auth('api')->user();

        if (! in_array($user->role, ['admin', 'manager'], true)) {
            abort(response()->json([
                'message' => 'Forbidden',
            ], 403));
        }

        Storage::delete([$attachment->file_path, $attachment->thumbnail_path]);

        $attachment->task->touch();

        $attachment->delete();

        return response()->json([
            'message' => 'Attachment deleted',
        ]);
    }

    private function authorizeTaskAccess(Task $task): void
    {
        $user = auth('api')->user();

        if ($user->role === 'member' && $task->assigned_user_id !== $user->id) {
            abort(response()->json([
                'message' => 'Forbidden',
            ], 403));
        }
    }
}
