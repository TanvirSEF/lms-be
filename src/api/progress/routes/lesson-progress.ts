const studentOnly = { roles: ['student'] };

export default {
  routes: [
    {
      method: 'POST',
      path: '/progress/complete',
      handler: 'lesson-progress.complete',
      config: {
        policies: [{ name: 'global::has-role', config: studentOnly }],
      },
    },
  ],
};
