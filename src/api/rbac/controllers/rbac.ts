type Ctx = {
  state: { user: { id: number; username: string; userRole?: string } };
  body?: unknown;
};

export default {
  check(ctx: Ctx) {
    ctx.body = {
      user: ctx.state.user.username,
      role: ctx.state.user.userRole,
    };
  },
};
