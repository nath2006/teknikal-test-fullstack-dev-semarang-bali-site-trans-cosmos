"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Eye, Plus, Trash2, X } from "lucide-react";

import { api } from "@/lib/api";
import { Button } from "@/components/Button";
import { FileDropzone } from "@/components/FileDropzone";
import { Topbar } from "@/components/layout/Topbar";
import { useAuth } from "@/hooks/useAuth";

import type { PaginatedResponse, Task, User } from "@/types";

type TaskForm = {
  title: string;
  description: string;
  status: Task["status"];
  priority: Task["priority"];
  assigned_user_id: string;
  due_date: string;
};

const initialForm: TaskForm = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  assigned_user_id: "",
  due_date: "",
};

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message ?? fallback;
  }

  return fallback;
}

export default function TasksPage() {
  const auth = useAuth();

  const canManageTasks = useMemo(() => {
    if (typeof auth?.canManageTasks === "boolean") return auth.canManageTasks;

    const role = auth?.user?.role;
    return role === "admin" || role === "manager";
  }, [auth]);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  const [form, setForm] = useState<TaskForm>(initialForm);

  const fetchTasks = useCallback(async () => {
    setLoading(true);

    try {
      const response = await api.get<PaginatedResponse<Task>>("/tasks");
      setTasks(response.data.data ?? []);
    } catch (error) {
      Swal.fire("Error", getErrorMessage(error, "Failed to load tasks"), "error");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!canManageTasks) {
      setUsers([]);
      return;
    }

    try {
      const response = await api.get<PaginatedResponse<User>>("/users");
      setUsers(response.data.data ?? []);
    } catch {
      setUsers([]);
    }
  }, [canManageTasks]);

  const fetchTaskDetail = useCallback(async (id: number) => {
    try {
      const response = await api.get<Task>(`/tasks/${id}`);
      setSelectedTask(response.data);
    } catch (error) {
      Swal.fire("Error", getErrorMessage(error, "Failed to load task detail"), "error");
    }
  }, []);

  async function createTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!canManageTasks || submitting) return;

    setSubmitting(true);

    try {
      await api.post("/tasks", {
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: form.status,
        priority: form.priority,
        assigned_user_id: form.assigned_user_id ? Number(form.assigned_user_id) : null,
        due_date: form.due_date || null,
      });

      Swal.fire("Success", "Task created successfully", "success");

      setForm(initialForm);
      setShowCreate(false);
      await fetchTasks();
    } catch (error) {
      Swal.fire("Error", getErrorMessage(error, "Failed to create task"), "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(task: Task, status: Task["status"]) {
    if (!canManageTasks || updatingStatusId) return;
    if (task.status === status) return;

    setUpdatingStatusId(task.id);

    try {
      await api.put(`/tasks/${task.id}`, { status });

      setTasks((currentTasks) =>
        currentTasks.map((item) => (item.id === task.id ? { ...item, status } : item)),
      );

      if (selectedTask?.id === task.id) {
        await fetchTaskDetail(task.id);
      }

      Swal.fire("Updated", "Task status updated", "success");
    } catch (error) {
      Swal.fire(
        "Error",
        getErrorMessage(error, "You are not allowed to update this task"),
        "error",
      );
    } finally {
      setUpdatingStatusId(null);
    }
  }

  async function deleteTask(id: number) {
    if (!canManageTasks || deletingId) return;

    const result = await Swal.fire({
      title: "Delete task?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) return;

    setDeletingId(id);

    try {
      await api.delete(`/tasks/${id}`);

      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id));
      setSelectedTask((currentTask) => (currentTask?.id === id ? null : currentTask));

      Swal.fire("Deleted", "Task deleted successfully", "success");
    } catch (error) {
      Swal.fire("Error", getErrorMessage(error, "Failed to delete task"), "error");
    } finally {
      setDeletingId(null);
    }
  }

  async function uploadAttachment(taskId: number, file: File) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      await api.post(`/tasks/${taskId}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Swal.fire("Uploaded", "Attachment uploaded successfully", "success");

      await fetchTaskDetail(taskId);
      await fetchTasks();
    } catch (error) {
      Swal.fire("Error", getErrorMessage(error, "Failed to upload attachment"), "error");
    }
  }

  async function downloadAttachment(attachmentId: number, fileName: string) {
    try {
      const response = await api.get<Blob>(`/attachments/${attachmentId}/download`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      Swal.fire("Error", getErrorMessage(error, "Failed to download attachment"), "error");
    }
  }

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <>
      <div className="mb-8 flex items-start justify-between gap-4">
        <Topbar title="Tasks" description="Create, manage, and review tasks." />

        {canManageTasks && (
          <Button onClick={() => setShowCreate(true)}>
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Task
            </span>
          </Button>
        )}
      </div>

      {showCreate && canManageTasks && (
        <section className="mb-8 rounded-2xl bg-white p-6 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Create Task</h2>
              <p className="mt-1 text-sm text-slate-500">Assign a task, set priority, and define the due date.</p>
            </div>

            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="cursor-pointer rounded-xl p-2 hover:bg-slate-100"
              aria-label="Close create task form"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={createTask} className="mt-5 grid gap-4 md:grid-cols-2">
            <input
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-black"
              placeholder="Task title"
              value={form.title}
              onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
              required
            />

            <input
              type="date"
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-black"
              value={form.due_date}
              onChange={(e) => setForm((current) => ({ ...current, due_date: e.target.value }))}
            />

            <select
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-black"
              value={form.priority}
              onChange={(e) =>
                setForm((current) => ({ ...current, priority: e.target.value as Task["priority"] }))
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <select
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-black"
              value={form.assigned_user_id}
              onChange={(e) => setForm((current) => ({ ...current, assigned_user_id: e.target.value }))}
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} - {user.role}
                </option>
              ))}
            </select>

            <textarea
              className="min-h-28 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-black md:col-span-2"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
            />

            <div className="flex gap-3 md:col-span-2">
              <Button type="submit" disabled={submitting || !form.title.trim()}>
                {submitting ? "Creating..." : "Create"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)} disabled={submitting}>
                Cancel
              </Button>
            </div>
          </form>
        </section>
      )}

      {loading ? (
        <div className="rounded-2xl bg-white p-8 text-center text-slate-500 shadow-soft">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-soft">
          <h3 className="font-semibold text-slate-950">No tasks found</h3>
          <p className="mt-1 text-sm text-slate-500">
            {canManageTasks ? "Create the first task to get started." : "There are no tasks assigned yet."}
          </p>
        </div>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {tasks.map((task) => (
            <article key={task.id} className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-950">{task.title}</h3>

                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {task.description || "No description"}
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                  {task.status.replace("_", " ")}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-slate-100 px-2 py-1 capitalize">{task.priority}</span>
                <span>{task.assignee?.name ?? "Unassigned"}</span>
                <span>{task.attachments_count ?? task.attachments?.length ?? 0} files</span>
                <span>{task.comments_count ?? 0} comments</span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => fetchTaskDetail(task.id)} className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Detail
                </Button>

                {canManageTasks && (
                  <select
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
                    value={task.status}
                    disabled={updatingStatusId === task.id}
                    onChange={(e) => updateStatus(task, e.target.value as Task["status"])}
                  >
                    <option value="todo">Todo</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                )}

                {canManageTasks && (
                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    disabled={deletingId === task.id}
                    className="flex cursor-pointer items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deletingId === task.id ? "Deleting..." : "Delete"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          canManageTasks={canManageTasks}
          onClose={() => setSelectedTask(null)}
          onUpload={uploadAttachment}
          onDownload={downloadAttachment}
        />
      )}
    </>
  );
}

function TaskDetailModal({
  task,
  canManageTasks,
  onClose,
  onUpload,
  onDownload,
}: {
  task: Task;
  canManageTasks: boolean;
  onClose: () => void;
  onUpload: (taskId: number, file: File) => Promise<void>;
  onDownload: (attachmentId: number, fileName: string) => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    if (uploading) return;

    setUploading(true);

    try {
      await onUpload(task.id, file);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">{task.title}</h2>
            <p className="mt-2 text-sm text-slate-500">{task.description || "No description"}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl p-2 hover:bg-slate-100"
            aria-label="Close task detail"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-3 text-sm">
          <DetailItem label="Status" value={task.status} />
          <DetailItem label="Priority" value={task.priority} />
          <DetailItem label="Assignee" value={task.assignee?.name ?? "Unassigned"} />
          <DetailItem label="Due Date" value={task.due_date ?? "-"} />
        </div>

        <div className="mt-6">
          <h3 className="mb-3 font-semibold">Upload Attachment</h3>
          <FileDropzone onFile={handleUpload} />
          {uploading && <p className="mt-2 text-sm text-slate-500">Uploading attachment...</p>}
        </div>

        <div className="mt-6">
          <h3 className="mb-3 font-semibold">Attachments</h3>

          {task.attachments?.length ? (
            <div className="space-y-2">
              {task.attachments.map((attachment) => (
                <button
                  key={attachment.id}
                  type="button"
                  onClick={() => onDownload(attachment.id, attachment.file_name)}
                  className="block w-full cursor-pointer rounded-xl border border-slate-200 px-4 py-3 text-left text-sm hover:bg-slate-50"
                >
                  {attachment.file_name}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No attachments.</p>
          )}
        </div>

        {!canManageTasks && (
          <p className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            You can view task detail and upload attachments. Task CRUD is limited to admin and manager.
          </p>
        )}
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium capitalize text-slate-900">{value.replace("_", " ")}</span>
    </div>
  );
}
