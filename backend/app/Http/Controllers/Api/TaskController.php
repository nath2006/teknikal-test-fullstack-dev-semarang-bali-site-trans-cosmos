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
        $query = Task::query()->with(['assignee:id,name,email','creator:id,name,email'])->withCount(['attachments','comments']);
        $query->when($request->status, fn($q, $v) => $q->where('status', $v));
        $query->when($request->priority, fn($q, $v) => $q->where('priority', $v));
        $query->when($request->assigned_user_id, fn($q, $v) => $q->where('assigned_user_id', $v));
        $query->when($request->search, fn($q, $v) => $q->where(fn($s) => $s->where('title','like',"%$v%")->orWhere('description','like',"%$v%")));
        $sort = in_array($request->get('sort'), ['created_at','due_date','priority','status','title'], true) ? $request->get('sort') : 'created_at';
        $direction = $request->get('direction') === 'asc' ? 'asc' : 'desc';
        return response()->json($query->orderBy($sort, $direction)->paginate($request->integer('per_page', 10)));
    }
    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $data['created_by'] = auth('api')->id();
        $task = Task::create($data)->load(['assignee','creator']);
        SendTaskAssignedNotification::dispatch($task);
        return response()->json($task, 201);
    }
    public function show(Task $task): JsonResponse { return response()->json($task->load(['assignee','creator','attachments','comments.user:id,name,email'])); }
    public function update(Request $request, Task $task): JsonResponse
    {
        $before = $task->assigned_user_id;
        $task->update($this->validated($request, true));
        if ($before !== $task->assigned_user_id) SendTaskAssignedNotification::dispatch($task->fresh());
        return response()->json($task->fresh()->load(['assignee','creator']));
    }
    public function destroy(Task $task): JsonResponse { $task->delete(); return response()->json(['message' => 'Task deleted']); }
    private function validated(Request $request, bool $partial = false): array
    {
        $rule = $partial ? 'sometimes' : 'required';
        return $request->validate([
            'title' => [$rule,'string','max:255'], 'description' => ['nullable','string'],
            'status' => ['sometimes','in:todo,in_progress,review,done'], 'priority' => ['sometimes','in:low,medium,high,urgent'],
            'assigned_user_id' => ['nullable','exists:users,id'], 'due_date' => ['nullable','date'],
        ]);
    }
}
