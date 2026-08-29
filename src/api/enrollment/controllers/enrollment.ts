import { errors } from '@strapi/utils';

import { courseProgress, docs, findCourse, isEnrolled } from '../../../helpers/course-access';

type Ctx = {
  request: { body: Record<string, unknown> };
  state: { user: { id: number; userRole: string } };
  body?: unknown;
};

export default {
  async enroll(ctx: Ctx) {
    const course = await findCourse(ctx.request.body.course, {
      instructor: { fields: ['username'] },
    });

    if (!course) {
      throw new errors.NotFoundError('Course not found');
    }

    if (await isEnrolled(ctx.state.user.id, course.id)) {
      throw new errors.ApplicationError('You are already enrolled in this course');
    }

    await docs('api::enrollment.enrollment').create({
      data: { student: ctx.state.user.id, course: course.id },
    });

    ctx.body = { data: { course: course.documentId } };
  },

  async my(ctx: Ctx) {
    const enrollments = await docs('api::enrollment.enrollment').findMany({
      filters: { student: ctx.state.user.id },
      populate: { course: { populate: { instructor: true } } },
      sort: { createdAt: 'desc' },
    });

    const data = await Promise.all(
      enrollments.map(async (enrollment: any) => ({
        course: {
          documentId: enrollment.course.documentId,
          title: enrollment.course.title,
          description: enrollment.course.description,
          coverUrl: enrollment.course.coverUrl,
          instructor: enrollment.course.instructor
            ? { username: enrollment.course.instructor.username }
            : null,
        },
        progress: await courseProgress(ctx.state.user.id, enrollment.course.id),
      }))
    );

    ctx.body = { data };
  },
};
