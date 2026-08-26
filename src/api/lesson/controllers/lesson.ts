import { errors } from '@strapi/utils';

type Ctx = {
  params: { documentId?: string };
  request: { body: Record<string, unknown> };
  state: { user: { id: number; userRole: string } };
  body?: unknown;
};

type Lesson = {
  id: number;
  documentId: string;
  course?: { id: number; instructor?: { id: number } | null } | null;
};

type LessonDocuments = {
  findMany: (params: Record<string, unknown>) => Promise<Lesson[]>;
  create: (params: { data: Record<string, unknown> }) => Promise<Lesson>;
  update: (params: { documentId: string; data: Record<string, unknown> }) => Promise<Lesson>;
  delete: (params: { documentId: string }) => Promise<Lesson>;
};

function lessonDocuments() {
  return strapi.documents('api::lesson.lesson') as unknown as LessonDocuments;
}

function courseDocuments() {
  return strapi.documents('api::course.course') as unknown as {
    findMany: (params: Record<string, unknown>) => Promise<Lesson['course'][]>;
  };
}

async function findCourse(documentId: unknown) {
  if (typeof documentId !== 'string') {
    return null;
  }

  const courses = await courseDocuments().findMany({
    filters: { documentId },
    populate: { instructor: true },
    limit: 1,
  });
  return courses[0] ?? null;
}

async function findLesson(documentId: string | undefined) {
  if (!documentId) {
    return null;
  }

  const lessons = await lessonDocuments().findMany({
    filters: { documentId },
    populate: { course: { populate: { instructor: true } } },
    limit: 1,
  });
  return lessons[0] ?? null;
}

function assertCourseOwner(ctx: Ctx, course: Lesson['course']) {
  if (ctx.state.user.userRole !== 'instructor') {
    return;
  }

  if (!course || course.instructor?.id !== ctx.state.user.id) {
    throw new errors.ForbiddenError('You can only manage lessons of your own courses');
  }
}

export default {
  async create(ctx: Ctx) {
    const course = await findCourse(ctx.request.body.course);

    if (!course) {
      throw new errors.NotFoundError('Course not found');
    }

    assertCourseOwner(ctx, course);

    const lesson = await lessonDocuments().create({
      data: { ...ctx.request.body, course: course.id },
    });
    ctx.body = { data: lesson };
  },

  async update(ctx: Ctx) {
    const lesson = await findLesson(ctx.params.documentId);

    if (!lesson) {
      throw new errors.NotFoundError('Lesson not found');
    }

    assertCourseOwner(ctx, lesson.course);

    const data = { ...ctx.request.body };
    delete data.course;

    const updated = await lessonDocuments().update({
      documentId: lesson.documentId,
      data,
    });
    ctx.body = { data: updated };
  },

  async delete(ctx: Ctx) {
    const lesson = await findLesson(ctx.params.documentId);

    if (!lesson) {
      throw new errors.NotFoundError('Lesson not found');
    }

    assertCourseOwner(ctx, lesson.course);

    await lessonDocuments().delete({ documentId: lesson.documentId });
    ctx.body = { data: { documentId: lesson.documentId } };
  },
};
