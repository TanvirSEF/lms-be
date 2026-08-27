# Decisions

Short log of the design decisions behind this project and why they were made.

1. **One PostgreSQL for local and production.** Both the local dev server and the Railway deployment point at the same Railway Postgres. This removes "works locally, breaks in production" database differences and makes every local change immediately visible on the live demo. Trade-off accepted: dev and prod share one dataset, which is fine for a demo project.

2. **App roles as a separate `userRole` field.** Strapi has its own role system (Public / Authenticated) used for its permission layer. The four application roles (admin, content manager, instructor, student) live in a separate enum field on the user, and a single reusable policy (`has-role`) enforces them per route. Two layers: Strapi decides who may call a route, our policy decides which of the four roles may perform the action.

3. **Registration always creates a student.** If users could pick a role at sign-up, anyone could register as admin. Promotions happen only from the admin panel.

4. **Instructor ownership checked on mutations, not by hiding UI.** Update and delete handlers load the record first and compare `course.instructor.id` with the logged-in user. Filtering lists is UX, the ownership check is the security.

5. **Public course API is sanitized.** Lesson content and video URLs are stripped from public endpoints; only enrolled students get them through the `learn` endpoint. Quiz `correctIndex` never reaches the student client — grading happens entirely on the server in the submit handler.

6. **Progress is derived, not stored as a percent.** A `LessonProgress` row is written once per completed lesson (idempotent upsert). The percent is computed as completed / total lessons per student and course, so adding lessons later recalculates automatically.

7. **Blog draft state via an explicit `status` field.** Draft posts are filtered out of every public query and return 404 on direct fetch, instead of relying on Strapi's draft-and-publish, which would still expose drafts through some routes.

8. **Default long-lived JWTs instead of the refresh-token flow.** The scaffold enabled short-lived access tokens with refresh cookies. Behind the Railway proxy the secure refresh cookie crashed logins (plain HTTP internally), and a refresh flow was unnecessary complexity for this app, so it runs on the default 30-day tokens.

9. **Bootstrap grants Strapi route permissions.** Because real authorization happens in our own policies, `src/index.ts` idempotently grants the Authenticated role access to our custom routes on boot, so new routes work without manual admin-panel clicks in every environment.

10. **Frontend: server components for public pages, client components for auth flows.** Course browse, detail and blog render on the server (SSR, always fresh). Anything needing the JWT (player, quizzes, manage, admin) is a client component with reusable dialogs and forms.
