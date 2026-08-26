import { errors } from '@strapi/utils';

type LooseDocuments = {
  findMany: (params: Record<string, unknown>) => Promise<any[]>;
  create: (params: { data: Record<string, unknown> }) => Promise<any>;
  update: (params: { documentId: string; data: Record<string, unknown> }) => Promise<any>;
  delete: (params: { documentId: string }) => Promise<any>;
};

export function docs(uid: string) {
  const getDocuments = strapi.documents.bind(strapi) as unknown as (uid: string) => unknown;
  return getDocuments(uid) as unknown as LooseDocuments;
}

export async function findCourse(documentId: unknown, populate: Record<string, unknown> = {}) {
  if (typeof documentId !== 'string') {
    return null;
  }

  const courses = await docs('api::course.course').findMany({
    filters: { documentId },
    populate,
    limit: 1,
  });
  return courses[0] ?? null;
}

export async function isEnrolled(studentId: number, courseId: number) {
  const rows = await docs('api::enrollment.enrollment').findMany({
    filters: { student: studentId, course: courseId },
    limit: 1,
  });
  return rows.length > 0;
}

export function assertCourseManager(
  user: { id: number; userRole: string },
  course: { instructor?: { id: number } | null } | null
) {
  if (user.userRole === 'admin' || user.userRole === 'content_manager') {
    return;
  }

  if (user.userRole === 'instructor' && course?.instructor?.id === user.id) {
    return;
  }

  throw new errors.ForbiddenError('You can only manage your own courses');
}

export async function courseProgress(studentId: number, courseId: number) {
  const lessons = await docs('api::lesson.lesson').findMany({
    filters: { course: courseId },
  });
  const total = lessons.length;

  if (total === 0) {
    return { total: 0, completed: 0, percent: 0 };
  }

  const progresses = await docs('api::progress.lesson-progress').findMany({
    filters: { student: studentId },
    populate: { lesson: true },
  });

  const lessonIds = new Set(lessons.map((lesson: any) => lesson.id));
  const completed = progresses.filter(
    (progress: any) => progress.lesson && lessonIds.has(progress.lesson.id)
  ).length;

  return { total, completed, percent: Math.round((completed / total) * 100) };
}
