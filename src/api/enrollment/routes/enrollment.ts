const studentOnly = { roles: ['student'] };

export default {
  routes: [
    {
      method: 'POST',
      path: '/enrollments/enroll',
      handler: 'enrollment.enroll',
      config: {
        policies: [{ name: 'global::has-role', config: studentOnly }],
      },
    },
    {
      method: 'GET',
      path: '/enrollments/my',
      handler: 'enrollment.my',
      config: {
        policies: [{ name: 'global::has-role', config: studentOnly }],
      },
    },
  ],
};
