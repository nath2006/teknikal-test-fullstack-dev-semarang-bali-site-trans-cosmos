# TaskFlow Backend

Laravel REST API for the task management assessment.

## Main Capabilities

- JWT authentication with `POST /api/auth/login`, `POST /api/auth/logout`, and `GET /api/auth/me`.
- Role-based task access for admin, manager, and assigned members.
- Task CRUD with pagination, filtering, searching, and sorting.
- Secure attachment upload/download with versioning, MIME validation, scan status simulation, and thumbnail placeholder processing.
- Task comments for authenticated users with task access.
- Server-Sent Events at `GET /api/realtime/tasks?token={jwt}`.
- Database queued jobs for notifications, attachment processing, bulk status update, and CSV export.

## Setup

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan jwt:secret
php artisan migrate --seed
php artisan serve
```

Run the queue worker:

```bash
php artisan queue:work
```

## Demo Login

- Admin: `user1@example.com` / `password`
- Manager: `user2@example.com` / `password`
- Member: `user3@example.com` / `password`

## Tests

```bash
php artisan test
```

## Documentation

- SQL schema: `database/schema.sql`
- OpenAPI: `../documentation/api-docs/openapi.yaml`
