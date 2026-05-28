# TaskFlow Frontend

Next.js dashboard for the task management assessment.

## Features

- JWT login/logout flow.
- Dashboard overview with realtime task refresh.
- Task page with search, filters, sorting, pagination, status updates, delete action, detail modal, comments, drag-and-drop upload, upload progress, and attachment download.
- Admin-only user management page.
- Clean responsive Tailwind UI.

## Setup

```bash
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Run locally:

```bash
npm run dev
```

## Verification

```bash
npm run lint
npx tsc --noEmit
npm run build
```
