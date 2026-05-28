<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\SendTaskAssignedNotification;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        $query = Task::query()
            ->with(['assignee:id,name,email,role', 'creator:id,name,email,role'])
            ->withCount(['attachments', 'comments']);

        if ($user->role === 'member') {
            $query->where('assigned_user_id', $user->id);
        }

        $query->when($request->status, fn ($q, $v) => $q->where('status', $v));
        $query->when($request->priority, fn ($q, $v) => $q->where('priority', $v));

        if ($user->role !== 'member') {
            $query->when(
                $request->assigned_user_id,
                fn ($q, $v) => $q->where('assigned_user_id', $v)
            );
        }

        $query->when($request->search, function ($q, $v) {
            $q->where(function ($s) use ($v) {
                $s->where('title', 'like', "%{$v}%")
                    ->orWhere('description', 'like', "%{$v}%");
            });
        });

        $sort = in_array($request->input('sort'), ['created_at', 'due_date', 'priority', 'status', 'title'], true)
            ? $request->input('sort')
            : 'created_at';

        $direction = $request->input('direction') === 'asc' ? 'asc' : 'desc';

        return response()->json(
            $query->orderBy($sort, $direction)
                ->paginate($request->integer('per_page', 10))
        );
    }

    public function store(Request $request): JsonResponse
    {
        $this->abortUnlessAdminOrManager();

        $data = $this->validated($request);

        $data['created_by'] = auth('api')->id();

        $task = Task::create($data)->load(['assignee', 'creator']);

        SendTaskAssignedNotification::dispatch($task);

        return response()->json($task, 201);
    }

    public function show(Task $task): JsonResponse
    {
        $this->authorizeTaskAccess($task);

        return response()->json(
            $task->load([
                'assignee:id,name,email,role',
                'creator:id,name,email,role',
                'attachments',
                'comments.user:id,name,email,role',
            ])
        );
    }

    public function update(Request $request, Task $task): JsonResponse
    {
        $user = auth('api')->user();

        $this->authorizeTaskAccess($task);

        $before = $task->assigned_user_id;

        if ($user->role === 'member') {
            $data = $request->validate([
                'status' => ['sometimes', 'in:todo,in_progress,review,done'],
                'priority' => ['sometimes', 'in:low,medium,high,urgent'],
            ]);
        } else {
            $data = $this->validated($request, true);
        }

        $task->update($data);

        if ($user->role !== 'member' && $before !== $task->assigned_user_id) {
            SendTaskAssignedNotification::dispatch($task->fresh());
        }

        return response()->json(
            $task->fresh()->load(['assignee:id,name,email,role', 'creator:id,name,email,role'])
        );
    }

    public function destroy(Task $task): JsonResponse
    {
        $this->abortUnlessAdminOrManager();

        $task->delete();

        return response()->json([
            'message' => 'Task deleted',
        ]);
    }

    private function validated(Request $request, bool $partial = false): array
    {
        $rule = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'title' => [$rule, 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'in:todo,in_progress,review,done'],
            'priority' => ['sometimes', 'in:low,medium,high,urgent'],
            'assigned_user_id' => ['nullable', 'exists:users,id'],
            'due_date' => ['nullable', 'date'],
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

    private function abortUnlessAdminOrManager(): void
    {
        $user = auth('api')->user();

        if (! in_array($user->role, ['admin', 'manager'], true)) {
            abort(response()->json([
                'message' => 'Forbidden',
            ], 403));
        }
    }
}
