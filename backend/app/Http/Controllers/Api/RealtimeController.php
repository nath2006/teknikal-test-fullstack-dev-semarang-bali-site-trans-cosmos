<?php

namespace App\Http\Controllers\Api;

use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;
use Tymon\JWTAuth\Facades\JWTAuth;

class RealtimeController
{
    public function __invoke(Request $request): StreamedResponse
    {
        $user = $this->authenticate($request);

        return response()->stream(function () use ($user) {
            $tasks = Task::query()
                ->when(
                    $user->role === 'member',
                    fn ($query) => $query->where('assigned_user_id', $user->id)
                )
                ->latest('updated_at')
                ->take(5)
                ->get(['id', 'title', 'status', 'priority', 'updated_at']);

            echo 'retry: 5000' . "\n";
            echo 'event: tasks' . "\n";
            echo 'data: ' . $tasks->toJson() . "\n\n";

            @ob_flush();
            flush();
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    private function authenticate(Request $request): User
    {
        $token = $request->bearerToken() ?: $request->query('token');

        if (! $token) {
            abort(response()->json(['message' => 'Unauthenticated'], 401));
        }

        try {
            $user = JWTAuth::setToken($token)->authenticate();
        } catch (Throwable) {
            abort(response()->json(['message' => 'Unauthenticated'], 401));
        }

        if (! $user) {
            abort(response()->json(['message' => 'Unauthenticated'], 401));
        }

        return $user;
    }
}
