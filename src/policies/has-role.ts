type PolicyCtx = {
  state: { user?: { id: number; username: string; userRole?: string } };
};

export default async (ctx: PolicyCtx, config: { roles?: string[] }) => {
  const user = ctx.state.user;
  const allowedRoles = config.roles ?? [];

  if (!user) {
    return false;
  }

  return allowedRoles.includes(user.userRole ?? '');
};
