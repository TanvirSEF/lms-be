const manageRoles = { roles: ['admin', 'content_manager', 'instructor'] };

export default {
  routes: [
    {
      method: 'GET',
      path: '/courses',
      handler: 'course.find',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/courses/:documentId',
      handler: 'course.findOne',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/courses',
      handler: 'course.create',
      config: {
        policies: [{ name: 'global::has-role', config: manageRoles }],
      },
    },
    {
      method: 'PUT',
      path: '/courses/:documentId',
      handler: 'course.update',
      config: {
        policies: [{ name: 'global::has-role', config: manageRoles }],
      },
    },
    {
      method: 'DELETE',
      path: '/courses/:documentId',
      handler: 'course.delete',
      config: {
        policies: [{ name: 'global::has-role', config: manageRoles }],
      },
    },
  ],
};
