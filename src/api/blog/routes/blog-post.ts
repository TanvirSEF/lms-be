const blogRoles = { roles: ['admin', 'content_manager'] };

export default {
  routes: [
    {
      method: 'GET',
      path: '/blogs',
      handler: 'blog-post.find',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/blogs/manage',
      handler: 'blog-post.manageList',
      config: {
        policies: [{ name: 'global::has-role', config: blogRoles }],
      },
    },
    {
      method: 'GET',
      path: '/blogs/:documentId',
      handler: 'blog-post.findOne',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/blogs',
      handler: 'blog-post.create',
      config: {
        policies: [{ name: 'global::has-role', config: blogRoles }],
      },
    },
    {
      method: 'PUT',
      path: '/blogs/:documentId',
      handler: 'blog-post.update',
      config: {
        policies: [{ name: 'global::has-role', config: blogRoles }],
      },
    },
    {
      method: 'DELETE',
      path: '/blogs/:documentId',
      handler: 'blog-post.delete',
      config: {
        policies: [{ name: 'global::has-role', config: blogRoles }],
      },
    },
  ],
};
