import { errors } from '@strapi/utils';

import { docs } from '../../../helpers/course-access';

type Ctx = {
  params: { documentId?: string };
  request: { body: Record<string, unknown> };
  state: { user: { id: number; userRole: string } };
  body?: unknown;
};

const ROLES = ['admin', 'content_manager', 'instructor', 'student'] as const;

async function count(uid: string, filters: Record<string, unknown> = {}) {
  const rows = await docs(uid).findMany({ filters });
  return rows.length;
}

export default {
  async stats(ctx: Ctx) {
    const users = await docs('plugin::users-permissions.user').findMany({});

    const byRole = { admin: 0, content_manager: 0, instructor: 0, student: 0 };
    users.forEach((user: any) => {
      if (user.userRole in byRole) {
        byRole[user.userRole as keyof typeof byRole] += 1;
      }
    });

    ctx.body = {
      data: {
        users: { total: users.length, byRole },
        courses: await count('api::course.course'),
        lessons: await count('api::lesson.lesson'),
        quizzes: await count('api::quiz.quiz'),
        enrollments: await count('api::enrollment.enrollment'),
        posts: {
          total: await count('api::blog.blog-post'),
          published: await count('api::blog.blog-post', { status: 'published' }),
          draft: await count('api::blog.blog-post', { status: 'draft' }),
        },
      },
    };
  },

  async users(ctx: Ctx) {
    const users = await docs('plugin::users-permissions.user').findMany({
      sort: { createdAt: 'asc' },
    });

    ctx.body = {
      data: users.map((user: any) => ({
        documentId: user.documentId,
        id: user.id,
        username: user.username,
        email: user.email,
        userRole: user.userRole,
        createdAt: user.createdAt,
      })),
    };
  },

  async setRole(ctx: Ctx) {
    const role = ctx.request.body.userRole;

    if (typeof role !== 'string' || !ROLES.includes(role as (typeof ROLES)[number])) {
      throw new errors.ValidationError('Invalid role');
    }

    const target = await docs('plugin::users-permissions.user').findMany({
      filters: { documentId: ctx.params.documentId },
      limit: 1,
    });

    if (target.length === 0) {
      throw new errors.NotFoundError('User not found');
    }

    if (target[0].id === ctx.state.user.id) {
      throw new errors.ApplicationError('You cannot change your own role');
    }

    await docs('plugin::users-permissions.user').update({
      documentId: ctx.params.documentId!,
      data: { userRole: role },
    });

    ctx.body = { data: { documentId: ctx.params.documentId, userRole: role } };
  },
};
