# Architecture Decisions

## Backend

Laravel is used because the assessment emphasizes PHP backend quality. The API uses controllers for HTTP boundaries, Eloquent models for relationships, request validation at controller boundary, JWT auth for stateless API access, database queues for background jobs, and private storage for uploaded files.

## Frontend

Next.js with TypeScript and Tailwind CSS provides a clean, maintainable UI. API access is centralized in `frontend/lib/api.ts`. Components are small and reusable: button, task card, and dropzone.

## Realtime

Server-Sent Events are implemented as a simple realtime channel for task updates. The frontend passes the JWT as a query token because the native `EventSource` API cannot set custom authorization headers. In production, replace this with Laravel Reverb/Pusher or a dedicated WebSocket service.

## Security

- Password hashing through Laravel casts.
- JWT protected routes.
- Upload MIME and size validation.
- Private file storage and controlled download endpoint.
- Indexed foreign keys for query performance.

## Background Jobs

Jobs cover assignment notification simulation, file processing, bulk status updates, and CSV task exports.
