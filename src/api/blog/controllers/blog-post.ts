import { errors } from '@strapi/utils';

import { docs } from '../../../helpers/course-access';

type Ctx = {
  params: { documentId?: string };
  request: { body: Record<string, unknown> };
  state: { user: { id: number; userRole: string } };
  body?: unknown;
};

const STATUSES = ['draft', 'published'] as const;

type BlogPost = {
  id: number;
  documentId: string;
  title: string;
  body: string | null;
  coverUrl: string | null;
  status: 'draft' | 'published';
  createdAt: string;
  author?: { username: string } | null;
};

async function findPosts(filters: Record<string, unknown>, populate: Record<string, unknown>) {
  return docs('api::blog.blog-post').findMany({
    filters,
    populate,
    sort: { createdAt: 'desc' },
  }) as unknown as Promise<BlogPost[]>;
}

function parseInput(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};

  if (typeof body.title === 'string') {
    data.title = body.title;
  }

  if (typeof body.body === 'string') {
    data.body = body.body;
  }

  if (typeof body.coverUrl === 'string') {
    data.coverUrl = body.coverUrl;
  }

  if (body.status !== undefined) {
    if (typeof body.status !== 'string' || !STATUSES.includes(body.status as (typeof STATUSES)[number])) {
      throw new errors.ValidationError('Invalid status');
    }
    data.status = body.status;
  }

  return data;
}

function toPost(post: BlogPost) {
  return {
    documentId: post.documentId,
    title: post.title,
    body: post.body,
    coverUrl: post.coverUrl,
    status: post.status,
    createdAt: post.createdAt,
    author: post.author ? { username: post.author.username } : null,
  };
}

export default {
  async find(ctx: Ctx) {
    const posts = await findPosts({ status: 'published' }, { author: { fields: ['username'] } });
    ctx.body = { data: posts.map(toPost) };
  },

  async findOne(ctx: Ctx) {
    const posts = await findPosts(
      { documentId: ctx.params.documentId, status: 'published' },
      { author: { fields: ['username'] } }
    );
    const post = posts[0];

    if (!post) {
      throw new errors.NotFoundError('Post not found');
    }

    ctx.body = { data: toPost(post) };
  },

  async manageList(ctx: Ctx) {
    const posts = await findPosts({}, { author: { fields: ['username'] } });
    ctx.body = { data: posts.map(toPost) };
  },

  async create(ctx: Ctx) {
    const data = parseInput(ctx.request.body);

    if (typeof data.title !== 'string') {
      throw new errors.ValidationError('Title is required');
    }

    const post = await docs('api::blog.blog-post').create({
      data: { ...data, author: ctx.state.user.id },
    });

    ctx.body = { data: { documentId: post.documentId } };
  },

  async update(ctx: Ctx) {
    const data = parseInput(ctx.request.body);
    const post = await docs('api::blog.blog-post').update({
      documentId: ctx.params.documentId!,
      data,
    });

    ctx.body = { data: { documentId: post.documentId } };
  },

  async delete(ctx: Ctx) {
    await docs('api::blog.blog-post').delete({ documentId: ctx.params.documentId! });
    ctx.body = { data: { documentId: ctx.params.documentId } };
  },
};
