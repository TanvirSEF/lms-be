import { errors } from '@strapi/utils';

import { assertCourseManager, docs, findCourse, isEnrolled } from '../../../helpers/course-access';

type Ctx = {
  params: { documentId?: string };
  request: { body: Record<string, unknown> };
  state: { user: { id: number; userRole: string } };
  body?: unknown;
};

type QuestionInput = {
  text: string;
  options: string[];
  correctIndex: number;
};

async function findQuiz(documentId: string | undefined, populate: Record<string, unknown> = {}) {
  if (!documentId) {
    return null;
  }

  const quizzes = await docs('api::quiz.quiz').findMany({
    filters: { documentId },
    populate,
    limit: 1,
  });
  return quizzes[0] ?? null;
}

function validateQuestions(input: unknown): QuestionInput[] {
  if (!Array.isArray(input) || input.length === 0) {
    throw new errors.ValidationError('A quiz needs at least one question');
  }

  return input.map((item) => {
    const question = item as Partial<QuestionInput>;

    if (
      typeof question.text !== 'string' ||
      !Array.isArray(question.options) ||
      question.options.length < 2 ||
      typeof question.correctIndex !== 'number' ||
      question.correctIndex < 0 ||
      question.correctIndex >= question.options.length
    ) {
      throw new errors.ValidationError('Invalid question data');
    }

    return question as QuestionInput;
  });
}

async function replaceQuestions(quizId: number, questions: QuestionInput[]) {
  const existing = await docs('api::quiz.question').findMany({
    filters: { quiz: quizId },
  });

  for (const question of existing) {
    await docs('api::quiz.question').delete({ documentId: question.documentId });
  }

  for (const question of questions) {
    await docs('api::quiz.question').create({
      data: { ...question, quiz: quizId },
    });
  }
}

export default {
  async create(ctx: Ctx) {
    const course = await findCourse(ctx.request.body.course, { instructor: true });

    if (!course) {
      throw new errors.NotFoundError('Course not found');
    }

    assertCourseManager(ctx.state.user, course);

    const title = ctx.request.body.title;
    if (typeof title !== 'string' || title.trim().length < 3) {
      throw new errors.ValidationError('Quiz title is too short');
    }

    const questions = validateQuestions(ctx.request.body.questions);

    const quiz = await docs('api::quiz.quiz').create({
      data: { title, course: course.id },
    });
    await replaceQuestions(quiz.id, questions);

    ctx.body = { data: { documentId: quiz.documentId } };
  },

  async update(ctx: Ctx) {
    const quiz = await findQuiz(ctx.params.documentId, {
      course: { populate: { instructor: true } },
    });

    if (!quiz) {
      throw new errors.NotFoundError('Quiz not found');
    }

    assertCourseManager(ctx.state.user, quiz.course);

    const data: Record<string, unknown> = {};

    if (typeof ctx.request.body.title === 'string') {
      data.title = ctx.request.body.title;
    }

    if (Object.keys(data).length > 0) {
      await docs('api::quiz.quiz').update({ documentId: quiz.documentId, data });
    }

    if (ctx.request.body.questions !== undefined) {
      await replaceQuestions(quiz.id, validateQuestions(ctx.request.body.questions));
    }

    ctx.body = { data: { documentId: quiz.documentId } };
  },

  async delete(ctx: Ctx) {
    const quiz = await findQuiz(ctx.params.documentId, {
      course: { populate: { instructor: true } },
    });

    if (!quiz) {
      throw new errors.NotFoundError('Quiz not found');
    }

    assertCourseManager(ctx.state.user, quiz.course);

    const questions = await docs('api::quiz.question').findMany({
      filters: { quiz: quiz.id },
    });

    for (const question of questions) {
      await docs('api::quiz.question').delete({ documentId: question.documentId });
    }

    await docs('api::quiz.quiz').delete({ documentId: quiz.documentId });
    ctx.body = { data: { documentId: quiz.documentId } };
  },

  async take(ctx: Ctx) {
    const quiz = (await findQuiz(ctx.params.documentId, {
      course: true,
      questions: { sort: { id: 'asc' } },
    })) as unknown as Record<string, any> | null;

    if (!quiz) {
      throw new errors.NotFoundError('Quiz not found');
    }

    if (!(await isEnrolled(ctx.state.user.id, quiz.course.id))) {
      throw new errors.ForbiddenError('Enroll in the course to take this quiz');
    }

    ctx.body = {
      data: {
        documentId: quiz.documentId,
        title: quiz.title,
        questions: quiz.questions.map((question: any) => ({
          documentId: question.documentId,
          text: question.text,
          options: question.options,
        })),
      },
    };
  },

  async submit(ctx: Ctx) {
    const quiz = (await findQuiz(ctx.params.documentId, {
      course: true,
      questions: { sort: { id: 'asc' } },
    })) as unknown as Record<string, any> | null;

    if (!quiz) {
      throw new errors.NotFoundError('Quiz not found');
    }

    if (!(await isEnrolled(ctx.state.user.id, quiz.course.id))) {
      throw new errors.ForbiddenError('Enroll in the course to take this quiz');
    }

    const answers = ctx.request.body.answers;

    if (!Array.isArray(answers) || answers.length !== quiz.questions.length) {
      throw new errors.ValidationError('Answer every question before submitting');
    }

    let score = 0;

    quiz.questions.forEach((question: any, index: number) => {
      if (answers[index] === question.correctIndex) {
        score += 1;
      }
    });

    await docs('api::quiz.quiz-attempt').create({
      data: {
        score,
        total: quiz.questions.length,
        answers,
        student: ctx.state.user.id,
        quiz: quiz.id,
      },
    });

    ctx.body = {
      data: {
        score,
        total: quiz.questions.length,
        correctAnswers: quiz.questions.map((question: any) => question.correctIndex),
      },
    };
  },

  async attempts(ctx: Ctx) {
    const attempts = await docs('api::quiz.quiz-attempt').findMany({
      filters: { student: ctx.state.user.id },
      populate: { quiz: { populate: { course: true } } },
      sort: { createdAt: 'desc' },
    });

    ctx.body = {
      data: attempts.map((attempt: any) => ({
        documentId: attempt.documentId,
        score: attempt.score,
        total: attempt.total,
        createdAt: attempt.createdAt,
        quiz: {
          title: attempt.quiz?.title ?? null,
          course: attempt.quiz?.course
            ? { documentId: attempt.quiz.course.documentId, title: attempt.quiz.course.title }
            : null,
        },
      })),
    };
  },
};
