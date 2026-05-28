<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_task(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $member = User::factory()->create(['role' => 'member']);

        $response = $this
            ->withHeaders($this->authHeaders($admin))
            ->postJson('/api/tasks', [
                'title' => 'Build realtime task view',
                'description' => 'Create the SSE-backed task dashboard.',
                'priority' => 'high',
                'status' => 'todo',
                'assigned_user_id' => $member->id,
                'due_date' => now()->addWeek()->toDateString(),
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('title', 'Build realtime task view')
            ->assertJsonPath('assigned_user_id', $member->id);
    }

    public function test_member_only_sees_assigned_tasks(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $member = User::factory()->create(['role' => 'member']);
        $otherMember = User::factory()->create(['role' => 'member']);

        $assignedTask = Task::create([
            'title' => 'Assigned task',
            'description' => 'Visible to assigned member',
            'status' => 'todo',
            'priority' => 'medium',
            'assigned_user_id' => $member->id,
            'created_by' => $admin->id,
        ]);

        Task::create([
            'title' => 'Other task',
            'description' => 'Not visible to this member',
            'status' => 'todo',
            'priority' => 'medium',
            'assigned_user_id' => $otherMember->id,
            'created_by' => $admin->id,
        ]);

        $response = $this
            ->withHeaders($this->authHeaders($member))
            ->getJson('/api/tasks');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $assignedTask->id);
    }

    public function test_assigned_member_can_update_status_and_comment(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $member = User::factory()->create(['role' => 'member']);

        $task = Task::create([
            'title' => 'Member task',
            'description' => 'Assigned member can progress this task.',
            'status' => 'todo',
            'priority' => 'medium',
            'assigned_user_id' => $member->id,
            'created_by' => $admin->id,
        ]);

        $this
            ->withHeaders($this->authHeaders($member))
            ->putJson("/api/tasks/{$task->id}", ['status' => 'in_progress'])
            ->assertOk()
            ->assertJsonPath('status', 'in_progress');

        $this
            ->withHeaders($this->authHeaders($member))
            ->postJson("/api/tasks/{$task->id}/comments", [
                'comment' => 'I have started working on this task.',
            ])
            ->assertCreated()
            ->assertJsonPath('comment', 'I have started working on this task.');
    }

    public function test_member_cannot_access_unassigned_task(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $member = User::factory()->create(['role' => 'member']);
        $otherMember = User::factory()->create(['role' => 'member']);

        $task = Task::create([
            'title' => 'Other member task',
            'description' => 'Should remain private to the assignee.',
            'status' => 'todo',
            'priority' => 'medium',
            'assigned_user_id' => $otherMember->id,
            'created_by' => $admin->id,
        ]);

        $this
            ->withHeaders($this->authHeaders($member))
            ->putJson("/api/tasks/{$task->id}", ['status' => 'done'])
            ->assertForbidden();

        $this
            ->withHeaders($this->authHeaders($member))
            ->postJson("/api/tasks/{$task->id}/comments", ['comment' => 'Trying to comment'])
            ->assertForbidden();
    }

    private function authHeaders(User $user): array
    {
        return [
            'Authorization' => 'Bearer ' . auth('api')->login($user),
            'Accept' => 'application/json',
        ];
    }
}
