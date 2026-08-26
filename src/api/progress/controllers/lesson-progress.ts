import { errors } from '@strapi/utils';

import { courseProgress, docs, isEnrolled } from '../../../helpers/course-access';

type Ctx = {
  request: { body: Record<string, unknown> };
  state: { user: { id: number; userRole: string } };
  body?: unknown;
};

export default {
  async complete(ctx: Ctx) {
    const lessons = await docs('api::lesson.lesson').findMany({
      filters: { documentId: ctx.request.body.lesson },
      populate: { course: true },
      limit: 1,
    });
    const lesson = lessons[0];

    if (!lesson?.course) {
      throw new errors.NotFoundError('Lesson not found');
    }

    if (!(await isEnrolled(ctx.state.user.id, lesson.course.id))) {
      throw new errors.ForbiddenError('Enroll in the course before completing lessons');
    }

    const existing = await docs('api::progress.lesson-progress').findMany({
      filters: { student: ctx.state.user.id, lesson: lesson.id },
      limit: 1,
    });

    if (existing.length === 0) {
      await docs('api::progress.lesson-progress').create({
        data: {
          student: ctx.state.user.id,
          lesson: lesson.id,
          completedAt: new Date().toISOString(),
        },
      });
    }

    ctx.body = { data: await courseProgress(ctx.state.user.id, lesson.course.id) };
  },
};
