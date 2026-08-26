import { errors } from '@strapi/utils';

type Ctx = {
  params: { documentId?: string };
  request: { body: Record<string, unknown> };
  state: { user: { id: number; userRole: string } };
  body?: unknown;
};

type Course = {
  id: number;
  documentId: string;
  instructor?: { id: number } | null;
};

type CourseDocuments = {
  findMany: (params: Record<string, unknown>) => Promise<Course[]>;
  create: (params: { data: Record<string, unknown> }) => Promise<Course>;
  update: (params: { documentId: string; data: Record<string, unknown> }) => Promise<Course>;
  delete: (params: { documentId: string }) => Promise<Course>;
};

function courseDocuments() {
  return strapi.documents('api::course.course') as unknown as CourseDocuments;
}

async function findByDocumentId(documentId: string | undefined, populate: Record<string, unknown> = {}) {
  if (!documentId) {
    return null;
  }

  const courses = await courseDocuments().findMany({
    filters: { documentId },
    populate,
    limit: 1,
  });
  return courses[0] ?? null;
}

async function assertCanManage(ctx: Ctx, documentId: string) {
  if (ctx.state.user.userRole !== 'instructor') {
    return;
  }

  const course = await findByDocumentId(documentId, { instructor: true });

  if (!course || course.instructor?.id !== ctx.state.user.id) {
    throw new errors.ForbiddenError('You can only manage your own courses');
  }
}

const coursePopulate = {
  instructor: { fields: ['username'] },
  lessons: { sort: { order: 'asc' } },
};

function toPublicCourse(course: Record<string, unknown>) {
  const lessons = (course.lessons as Record<string, unknown>[] | undefined) ?? [];

  return {
    ...course,
    lessons: lessons.map(({ documentId, title, order }) => ({ documentId, title, order })),
  };
}

export default {
  async find(ctx: Ctx) {
    const courses = await courseDocuments().findMany({
      populate: coursePopulate,
      sort: { createdAt: 'desc' },
    });
    ctx.body = { data: courses.map(toPublicCourse) };
  },

  async findOne(ctx: Ctx) {
    const course = await findByDocumentId(ctx.params.documentId, coursePopulate);

    if (!course) {
      throw new errors.NotFoundError('Course not found');
    }

    ctx.body = { data: toPublicCourse(course as unknown as Record<string, unknown>) };
  },

  async create(ctx: Ctx) {
    const data = { ...ctx.request.body };

    if (ctx.state.user.userRole === 'instructor') {
      data.instructor = ctx.state.user.id;
    }

    const course = await courseDocuments().create({ data });
    ctx.body = { data: course };
  },

  async update(ctx: Ctx) {
    const documentId = ctx.params.documentId!;
    await assertCanManage(ctx, documentId);

    const data = { ...ctx.request.body };

    if (ctx.state.user.userRole === 'instructor') {
      delete data.instructor;
    }

    const course = await courseDocuments().update({ documentId, data });
    ctx.body = { data: course };
  },

  async delete(ctx: Ctx) {
    const documentId = ctx.params.documentId!;
    await assertCanManage(ctx, documentId);

    await courseDocuments().delete({ documentId });
    ctx.body = { data: { documentId } };
  },
};
