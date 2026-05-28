"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { ChevronLeft, ChevronRight, Eye, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";

import { api } from "@/lib/api";
import { Button } from "@/components/Button";
import { FileDropzone } from "@/components/FileDropzone";
import { Topbar } from "@/components/layout/Topbar";
import { useAuth } from "@/hooks/useAuth";
import { useTaskRealtime } from "@/hooks/useTaskRealtime";

import type { PaginatedResponse, Task, User } from "@/types";

type TaskForm = {
  title: string;
  description: string;
  status: Task["status"];
  priority: Task["priority"];
  assigned_user_id: string;
  due_date: string;
};

type TaskFilters = {
  search: string;
  status: string;
  priority: string;
  sort: "created_at" | "due_date" | "priority" | "status" | "title";
  direction: "asc" | "desc";
};

type PaginationState = {
  current_page: number;
  last_page: number;
  total: number;
};

const initialForm: TaskForm = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  assigned_user_id: "",
  due_date: "",
};

const initialFilters: TaskFilters = {
  search: "",
  status: "",
  priority: "",
  sort: "created_at",
  direction: "desc",
};

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message ?? fallback;
  }

  return fallback;
}

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default function TasksPage() {
  const auth = useAuth();

  const canManageTasks = useMemo(() => auth.isAdmin || auth.isManager, [auth.isAdmin, auth.isManager]);
  const canUpdateTask = useMemo(() => auth.canUpdateTask, [auth.canUpdateTask]);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  const [form, setForm] = useState<TaskForm>(initialForm);
  const [filters, setFilters] = useState<TaskFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationState>({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  const fetchTasks = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const response = await api.get<PaginatedResponse<Task>>("/tasks", {
        params: {
          page,
          per_page: 9,
          sort: filters.sort,
          direction: filters.direction,
          ...(filters.search ? { search: filters.search } : {}),
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.priority ? { priority: filters.priority } : {}),
        },
      });

      setTasks(response.data.data ?? []);
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        total: response.data.total,
      });
    } catch (error) {
      Swal.fire("Error", getErrorMessage(error, "Failed to load tasks"), "error");
      setTasks([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filters, page]);

  const fetchUsers = useCallback(async () => {
    if (!canManageTasks) {
      setUsers([]);
      return;
    }

    try {
      const response = await api.get<PaginatedResponse<User>>("/users", {
        params: { per_page: 100 },
      });
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

  const handleRealtimeTaskEvent = useCallback(() => {
    void fetchTasks(true);

    if (selectedTask?.id) {
      void fetchTaskDetail(selectedTask.id);
    }
  }, [fetchTaskDetail, fetchTasks, selectedTask]);

  function updateFilter<K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  function resetFilters() {
    setFilters(initialFilters);
    setPage(1);
  }

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
    if (!canUpdateTask || updatingStatusId) return;
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

  async function uploadAttachment(taskId: number, file: File, onProgress?: (progress: number) => void) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      await api.post(`/tasks/${taskId}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (!event.total) return;

          onProgress?.(Math.round((event.loaded * 100) / event.total));
        },
      });

      onProgress?.(100);
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

  async function addComment(taskId: number, comment: string) {
    try {
      await api.post(`/tasks/${taskId}/comments`, { comment });

      await fetchTaskDetail(taskId);
      await fetchTasks();
    } catch (error) {
      Swal.fire("Error", getErrorMessage(error, "Failed to add comment"), "error");
      throw error;
    }
  }

  useTaskRealtime(handleRealtimeTaskEvent);

  useEffect(() => {
    void Promise.resolve().then(() => fetchTasks());
  }, [fetchTasks]);

  useEffect(() => {
    void Promise.resolve().then(fetchUsers);
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

      <section className="mb-6 rounded-2xl bg-white p-4 shadow-soft">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-black"
              placeholder="Search tasks"
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
            />
          </label>

          <select
            className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-black"
            value={filters.status}
            onChange={(e) => updateFilter("status", e.target.value)}
          >
            <option value="">All Status</option>
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>

          <select
            className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-black"
            value={filters.priority}
            onChange={(e) => updateFilter("priority", e.target.value)}
          >
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <select
            className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-black"
            value={filters.sort}
            onChange={(e) => updateFilter("sort", e.target.value as TaskFilters["sort"])}
          >
            <option value="created_at">Created</option>
            <option value="due_date">Due Date</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
            <option value="title">Title</option>
          </select>

          <select
            className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-black"
            value={filters.direction}
            onChange={(e) => updateFilter("direction", e.target.value as TaskFilters["direction"])}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>

          <Button type="button" variant="ghost" onClick={resetFilters} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </section>

      {loading ? (
        <div className="rounded-2xl bg-white p-8 text-center text-slate-500 shadow-soft">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-soft">
          <h3 className="font-semibold text-slate-950">No tasks found</h3>
          <p className="mt-1 text-sm text-slate-500">
            {filters.search || filters.status || filters.priority
              ? "No tasks match the current filters."
              : canManageTasks
                ? "Create the first task to get started."
                : "There are no tasks assigned yet."}
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

                {canUpdateTask && (
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

      {pagination.last_page > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-soft">
          <p className="text-sm text-slate-500">
            Page {pagination.current_page} of {pagination.last_page} - {pagination.total} tasks
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={pagination.current_page <= 1 || loading}
              className="cursor-pointer rounded-xl border border-slate-200 p-2 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pagination.last_page, current + 1))}
              disabled={pagination.current_page >= pagination.last_page || loading}
              className="cursor-pointer rounded-xl border border-slate-200 p-2 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          canManageTasks={canManageTasks}
          canUpdateTask={canUpdateTask}
          onClose={() => setSelectedTask(null)}
          onUpload={uploadAttachment}
          onDownload={downloadAttachment}
          onAddComment={addComment}
        />
      )}
    </>
  );
}

function TaskDetailModal({
  task,
  canManageTasks,
  canUpdateTask,
  onClose,
  onUpload,
  onDownload,
  onAddComment,
}: {
  task: Task;
  canManageTasks: boolean;
  canUpdateTask: boolean;
  onClose: () => void;
  onUpload: (taskId: number, file: File, onProgress?: (progress: number) => void) => Promise<void>;
  onDownload: (attachmentId: number, fileName: string) => Promise<void>;
  onAddComment: (taskId: number, comment: string) => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);

  async function handleUpload(file: File) {
    if (uploading) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      await onUpload(task.id, file, setUploadProgress);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function handleCommentSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const comment = commentText.trim();
    if (!comment || commenting) return;

    setCommenting(true);

    try {
      await onAddComment(task.id, comment);
      setCommentText("");
    } finally {
      setCommenting(false);
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
          <DetailItem label="Due Date" value={formatDate(task.due_date)} />
        </div>

        <div className="mt-6">
          <h3 className="mb-3 font-semibold">Upload Attachment</h3>
          <FileDropzone onFile={handleUpload} />
          {uploading && (
            <div className="mt-3">
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-black transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-slate-500">Uploading attachment... {uploadProgress}%</p>
            </div>
          )}
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
                  <span className="block font-medium text-slate-800">{attachment.file_name}</span>
                  <span className="mt-1 block text-xs capitalize text-slate-400">
                    Version {attachment.version ?? 1}
                    {attachment.scan_status ? ` - ${attachment.scan_status}` : ""}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No attachments.</p>
          )}
        </div>

        <div className="mt-6">
          <h3 className="mb-3 font-semibold">Comments</h3>

          {task.comments?.length ? (
            <div className="space-y-3">
              {task.comments.map((comment) => (
                <div key={comment.id} className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900">{comment.user?.name ?? "User"}</span>
                    <span className="text-xs text-slate-400">
                      {comment.created_at ? new Date(comment.created_at).toLocaleString() : ""}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-slate-600">{comment.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No comments yet.</p>
          )}

          <form onSubmit={handleCommentSubmit} className="mt-4 space-y-3">
            <textarea
              className="min-h-24 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-black disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Write a comment"
              value={commentText}
              maxLength={5000}
              disabled={commenting}
              onChange={(e) => setCommentText(e.target.value)}
              required
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={commenting || !commentText.trim()}>
                {commenting ? "Posting..." : "Add Comment"}
              </Button>
            </div>
          </form>
        </div>

        {!canManageTasks && (
          <p className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            {canUpdateTask
              ? "You can update status, upload attachments, and add comments. Task create/delete is limited to admin and manager."
              : "You can view task detail and upload attachments. Task create/delete is limited to admin and manager."}
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
