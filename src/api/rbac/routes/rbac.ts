export default {
  routes: [
    {
      method: 'GET',
      path: '/rbac-check',
      handler: 'rbac.check',
      config: {
        policies: [
          {
            name: 'global::has-role',
            config: { roles: ['instructor', 'content_manager', 'admin'] },
          },
        ],
      },
    },
  ],
};
