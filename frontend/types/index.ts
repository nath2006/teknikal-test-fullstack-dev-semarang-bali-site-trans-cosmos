export type Role = "admin" | "manager" | "member";

export type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
  created_at?: string;
  updated_at?: string;
};

export type Attachment = {
  id: number;
  task_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at?: string;
};

export type TaskComment = {
  id: number;
  task_id: number;
  user_id: number;
  comment: string;
  created_at: string;
  user?: User;
};

export type Task = {
  id: number;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  assigned_user_id: number | null;
  created_by: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  assignee?: User | null;
  creator?: User;
  attachments?: Attachment[];
  comments?: TaskComment[];
  attachments_count?: number;
  comments_count?: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
};
