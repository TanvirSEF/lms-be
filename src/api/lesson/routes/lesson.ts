const manageRoles = { roles: ['admin', 'content_manager', 'instructor'] };

export default {
  routes: [
    {
      method: 'POST',
      path: '/lessons',
      handler: 'lesson.create',
      config: {
        policies: [{ name: 'global::has-role', config: manageRoles }],
      },
    },
    {
      method: 'PUT',
      path: '/lessons/:documentId',
      handler: 'lesson.update',
      config: {
        policies: [{ name: 'global::has-role', config: manageRoles }],
      },
    },
    {
      method: 'DELETE',
      path: '/lessons/:documentId',
      handler: 'lesson.delete',
      config: {
        policies: [{ name: 'global::has-role', config: manageRoles }],
      },
    },
  ],
};
