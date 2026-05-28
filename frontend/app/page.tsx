import Link from 'next/link';
import { Button } from '@/components/Button';

export default function Home() {
  return(
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-6 py-16">
    <section className="mx-auto max-w-5xl rounded-3xl bg-white p-10 shadow-soft ring-1 ring-slate-100">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
        TaskFlow
      </p>
      <h1 className="mt-4 max-w-3xl text-5xl font-bold tracking-tight text-slate-950">
        Modern task management with Laravel API and Next.js UI.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-slate-600">
        Clean dashboard, JWT authentication, file uploads, realtime server-sent updates, queues, filtering, and responsive Tailwind styling.
      </p>
      <Link href="/login" className="mt-8 inline-block">
        <Button>Open dashboard</Button>
      </Link>
    </section>
  </main>
  )
}
