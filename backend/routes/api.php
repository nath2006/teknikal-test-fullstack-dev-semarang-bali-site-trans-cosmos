<?php

use App\Http\Controllers\Api\AttachmentController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\RealtimeController;
use App\Http\Controllers\Api\TaskController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:api')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

Route::middleware('auth:api')->group(function () {
    Route::apiResource('tasks', TaskController::class)->except(['show']);
    Route::get('tasks/{task}', [TaskController::class, 'show']);

    Route::post('tasks/{task}/attachments', [AttachmentController::class, 'store']);
    Route::post('tasks/{task}/comments', [CommentController::class, 'store']);

    Route::get('attachments/{attachment}/download', [AttachmentController::class, 'download']);
    Route::delete('attachments/{attachment}', [AttachmentController::class, 'destroy']);

    Route::get('realtime/tasks', RealtimeController::class);
});
