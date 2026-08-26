const authenticatedActions = [
  'api::rbac.rbac.check',
  'api::course.course.find',
  'api::course.course.findOne',
  'api::course.course.manageList',
  'api::course.course.create',
  'api::course.course.update',
  'api::course.course.delete',
  'api::lesson.lesson.create',
  'api::lesson.lesson.update',
  'api::lesson.lesson.delete',
];

async function grantAuthenticatedPermissions(strapi: any) {
  const role = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'authenticated' } });

  if (!role) {
    return;
  }

  const permissions = await strapi
    .query('plugin::users-permissions.permission')
    .findMany({ where: { role: role.id } });

  const existing = new Set(permissions.map((permission: any) => permission.action));

  for (const action of authenticatedActions) {
    if (!existing.has(action)) {
      await strapi.query('plugin::users-permissions.permission').create({
        data: { action, role: role.id },
      });
    }
  }
}

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: any }) {
    await grantAuthenticatedPermissions(strapi);
  },
};
