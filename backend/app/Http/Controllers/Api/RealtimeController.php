<?php

namespace App\Http\Controllers\Api;

use App\Models\Task;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RealtimeController
{
    public function __invoke(): StreamedResponse
    {
        return response()->stream(function () {
            while (true) {
                echo 'event: tasks' . "\n";
                echo 'data: ' . Task::latest('updated_at')->take(5)->get(['id','title','status','priority','updated_at'])->toJson() . "\n\n";
                ob_flush(); flush(); sleep(5);
            }
        }, 200, ['Content-Type' => 'text/event-stream', 'Cache-Control' => 'no-cache']);
    }
}
