# LMS Backend

Strapi backend for a Learning Management System with four user roles, course management, progress tracking and auto-graded quizzes.

- Live API: https://lms-be-production-39f4.up.railway.app
- Frontend repo: https://github.com/TanvirSEF/lms-fe
- Frontend live: https://lms-fe-nine-ivory.vercel.app

## Tech

- Strapi 5 (TypeScript)
- PostgreSQL on Railway
- users-permissions JWT auth + custom role policies

## Roles

| Role | Access |
| --- | --- |
| Admin | everything, including user role management |
| Content manager | all courses, lessons, quizzes and blog posts |
| Instructor | own courses only (lessons + quizzes), student progress |
| Student | enroll, lessons, progress, quizzes, blog reading |

Registration always creates a student. Other roles are assigned by an admin.

## API overview

Custom endpoints enforce role and ownership checks in policies and controllers:

| Endpoint | Access |
| --- | --- |
| `GET /api/courses`, `GET /api/courses/:documentId` | public, lesson content stripped |
| `GET /api/courses/manage` | admin / CM (all) or instructor (own) |
| `POST/PUT/DELETE /api/courses` | admin / CM / instructor, ownership checked |
| `POST/PUT/DELETE /api/lessons` | same, ownership via parent course |
| `GET /api/courses/:documentId/learn` | enrolled students, owner instructor, admin / CM |
| `POST /api/enrollments/enroll` | student, blocks double enrollment |
| `GET /api/enrollments/my` | student, courses with progress percent |
| `POST /api/progress/complete` | student, must be enrolled, idempotent |
| `POST/PUT/DELETE /api/quizzes` | admin / CM / instructor, ownership checked |
| `GET /api/quizzes/:documentId/take` | enrolled student, correct answers stripped |
| `POST /api/quizzes/:documentId/submit` | enrolled student, graded on the server |
| `GET /api/quizzes/attempts` | student, own attempt history |
| `GET /api/blogs`, `GET /api/blogs/:documentId` | public, published posts only |
| `POST/PUT/DELETE /api/blogs`, `GET /api/blogs/manage` | admin / CM |
| `GET /api/admin/stats` | admin |
| `GET /api/admin/users`, `PUT /api/admin/users/:documentId/role` | admin, self role change blocked |

## Run locally

```bash
pnpm install
cp .env.example .env
pnpm develop
```

Set `DATABASE_URL` in `.env` to a PostgreSQL connection string (the project uses a single Railway Postgres for both local and production). Strapi starts on http://localhost:1337.

## Demo accounts

All passwords are `test1234`.

| Username | Role |
| --- | --- |
| admin1 | admin |
| cm1 | content manager |
| instructor1 | instructor |
| ltest1 | instructor (second one, for ownership demos) |
| student1 | student, enrolled in "Next.js from Scratch" |
| student2 | student, not enrolled |
