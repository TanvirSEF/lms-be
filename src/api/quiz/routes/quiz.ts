const manageRoles = { roles: ['admin', 'content_manager', 'instructor'] };
const studentOnly = { roles: ['student'] };

export default {
  routes: [
    {
      method: 'GET',
      path: '/quizzes/attempts',
      handler: 'quiz.attempts',
      config: {
        policies: [{ name: 'global::has-role', config: studentOnly }],
      },
    },
    {
      method: 'POST',
      path: '/quizzes',
      handler: 'quiz.create',
      config: {
        policies: [{ name: 'global::has-role', config: manageRoles }],
      },
    },
    {
      method: 'PUT',
      path: '/quizzes/:documentId',
      handler: 'quiz.update',
      config: {
        policies: [{ name: 'global::has-role', config: manageRoles }],
      },
    },
    {
      method: 'DELETE',
      path: '/quizzes/:documentId',
      handler: 'quiz.delete',
      config: {
        policies: [{ name: 'global::has-role', config: manageRoles }],
      },
    },
    {
      method: 'GET',
      path: '/quizzes/:documentId/take',
      handler: 'quiz.take',
      config: {
        policies: [{ name: 'global::has-role', config: studentOnly }],
      },
    },
    {
      method: 'POST',
      path: '/quizzes/:documentId/submit',
      handler: 'quiz.submit',
      config: {
        policies: [{ name: 'global::has-role', config: studentOnly }],
      },
    },
  ],
};
