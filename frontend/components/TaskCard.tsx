import { CalendarDays, MessageSquare, Paperclip } from 'lucide-react';
import type { Task } from '@/types';

const badge = { todo: 'bg-slate-100 text-slate-700', in_progress: 'bg-blue-100 text-blue-700', review: 'bg-amber-100 text-amber-700', done: 'bg-emerald-100 text-emerald-700' };
export function TaskCard({ task }: { task: Task }) {
  return <article className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-slate-100">
    <div className="flex items-start justify-between gap-3">
      <div><h3 className="font-semibold text-slate-950">{task.title}</h3><p className="mt-1 line-clamp-2 text-sm text-slate-500">{task.description}</p></div>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge[task.status]}`}>{task.status.replace('_', ' ')}</span>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
      <span className="rounded-full bg-slate-100 px-2 py-1 font-medium">{task.priority}</span>
      {task.due_date && <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" />{task.due_date}</span>}
      <span className="flex items-center gap-1"><Paperclip className="h-4 w-4" />{task.attachments_count ?? 0}</span>
      <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" />{task.comments_count ?? 0}</span>
    </div>
  </article>;
}
