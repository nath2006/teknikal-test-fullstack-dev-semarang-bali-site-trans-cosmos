<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function store(Request $request, Task $task): JsonResponse
    {
        $data = $request->validate(['comment' => ['required','string','max:5000']]);
        $comment = $task->comments()->create(['user_id' => auth('api')->id(), 'comment' => $data['comment'], 'created_at' => now()]);
        return response()->json($comment->load('user:id,name,email'), 201);
    }
}
