const manageRoles = { roles: ['admin', 'content_manager', 'instructor'] };
const allRoles = { roles: ['admin', 'content_manager', 'instructor', 'student'] };

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
      path: '/courses/manage',
      handler: 'course.manageList',
      config: {
        policies: [{ name: 'global::has-role', config: manageRoles }],
      },
    },
    {
      method: 'GET',
      path: '/courses/instructors',
      handler: 'course.instructors',
      config: {
        policies: [{ name: 'global::has-role', config: manageRoles }],
      },
    },
    {
      method: 'GET',
      path: '/courses/:documentId',
      handler: 'course.findOne',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/courses/:documentId/learn',
      handler: 'course.learn',
      config: {
        policies: [{ name: 'global::has-role', config: allRoles }],
      },
    },
    {
      method: 'GET',
      path: '/courses/:documentId/students',
      handler: 'course.students',
      config: {
        policies: [{ name: 'global::has-role', config: manageRoles }],
      },
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
