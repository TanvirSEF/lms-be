const adminOnly = { roles: ['admin'] };

const adminRoute = (method: string, path: string, handler: string) => ({
  method,
  path,
  handler,
  config: { policies: [{ name: 'global::has-role', config: adminOnly }] },
});

export default {
  routes: [
    adminRoute('GET', '/admin/stats', 'admin.stats'),
    adminRoute('GET', '/admin/users', 'admin.users'),
    adminRoute('PUT', '/admin/users/:documentId/role', 'admin.setRole'),
  ],
};
