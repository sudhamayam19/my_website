import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const postStatusValidator = v.union(v.literal("published"), v.literal("draft"));

const postInputValidator = v.object({
  id: v.optional(v.string()),
  slug: v.optional(v.string()),
  title: v.string(),
  excerpt: v.string(),
  content: v.array(v.string()),
  category: v.string(),
  publishedAt: v.string(),
  readTimeMinutes: v.number(),
  coverGradient: v.string(),
  status: postStatusValidator,
  featured: v.boolean(),
  seoDescription: v.string(),
});

interface PostRecord {
  _id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  category: string;
  publishedAt: string;
  publishedAtTs: number;
  readTimeMinutes: number;
  coverGradient: string;
  status: "published" | "draft";
  featured: boolean;
  seoDescription: string;
}

interface CommentRecord {
  _id: string;
  postId: string;
  author: string;
  message: string;
  createdAt: string;
  createdAtTs: number;
}

function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `post-${Date.now()}`;
}

function normalizePublishedAt(input: string): { publishedAt: string; publishedAtTs: number } {
  const parsedMs = Date.parse(input);
  const parsed = Number.isNaN(parsedMs) ? new Date() : new Date(parsedMs);
  const publishedAt = parsed.toISOString().slice(0, 10);
  const publishedAtTs = Date.parse(`${publishedAt}T00:00:00.000Z`);
  return { publishedAt, publishedAtTs };
}

function normalizeIsoDatetime(input: string): { iso: string; ts: number } {
  const parsedMs = Date.parse(input);
  const parsed = Number.isNaN(parsedMs) ? new Date() : new Date(parsedMs);
  return { iso: parsed.toISOString(), ts: parsed.getTime() };
}

function normalizePostInput(input: {
  slug?: string;
  title: string;
  excerpt: string;
  content: string[];
  category: string;
  publishedAt: string;
  readTimeMinutes: number;
  coverGradient: string;
  status: "published" | "draft";
  featured: boolean;
  seoDescription: string;
}) {
  const title = input.title.trim();
  const excerpt = input.excerpt.trim();
  const category = input.category.trim();
  const content = input.content.map((paragraph) => paragraph.trim()).filter(Boolean);
  const seoDescription = input.seoDescription.trim() || excerpt;
  const slug = slugify(input.slug?.trim() || title);
  const readTimeMinutes = Math.max(1, Math.min(60, Math.round(input.readTimeMinutes)));
  const { publishedAt, publishedAtTs } = normalizePublishedAt(input.publishedAt);

  if (!title || !excerpt || !category || content.length === 0) {
    throw new Error("Required fields are missing.");
  }

  return {
    slug,
    title,
    excerpt,
    content,
    category,
    publishedAt,
    publishedAtTs,
    readTimeMinutes,
    coverGradient: input.coverGradient.trim(),
    status: input.status,
    featured: input.featured,
    seoDescription,
  };
}

async function buildUniqueSlug(db: unknown, requested: string, currentId?: string) {
  const database = db as {
    query(table: "posts"): {
      withIndex(
        index: "by_slug",
        builder: (query: { eq(field: "slug", value: string): unknown }) => unknown,
      ): {
        first(): Promise<PostRecord | null>;
      };
    };
  };

  let candidate = requested;
  let suffix = 2;

  for (;;) {
    const existing = await database
      .query("posts")
      .withIndex("by_slug", (query) => query.eq("slug", candidate))
      .first();

    if (!existing || existing._id === currentId) {
      return candidate;
    }

    candidate = `${requested}-${suffix}`;
    suffix += 1;
  }
}

function mapPost(doc: PostRecord) {
  return {
    id: String(doc._id),
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.excerpt,
    content: doc.content,
    category: doc.category,
    publishedAt: doc.publishedAt,
    readTimeMinutes: doc.readTimeMinutes,
    coverGradient: doc.coverGradient,
    status: doc.status,
    featured: doc.featured,
    seoDescription: doc.seoDescription,
  };
}

function mapComment(doc: CommentRecord) {
  return {
    id: String(doc._id),
    postId: String(doc.postId),
    author: doc.author,
    message: doc.message,
    createdAt: doc.createdAt,
  };
}

export const listPosts = queryGeneric({
  args: {
    includeDrafts: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const includeDrafts = args.includeDrafts ?? false;
    const docs = includeDrafts
      ? await ctx.db.query("posts").collect()
      : await ctx.db
          .query("posts")
          .withIndex("by_status_publishedAtTs", (query) =>
            query.eq("status", "published"),
          )
          .collect();

    return docs.sort((a, b) => b.publishedAtTs - a.publishedAtTs).map(mapPost);
  },
});

export const listFeaturedPosts = queryGeneric({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(12, args.limit ?? 3));
    const docs = await ctx.db
      .query("posts")
      .withIndex("by_featured_publishedAtTs", (query) => query.eq("featured", true))
      .collect();

    return docs
      .filter((doc) => doc.status === "published")
      .sort((a, b) => b.publishedAtTs - a.publishedAtTs)
      .slice(0, limit)
      .map(mapPost);
  },
});

export const getPostById = queryGeneric({
  args: {
    id: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    return post ? mapPost(post) : null;
  },
});

export const listCategories = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db
      .query("posts")
      .withIndex("by_status_publishedAtTs", (query) => query.eq("status", "published"))
      .collect();
    return Array.from(new Set(docs.map((doc) => doc.category)));
  },
});

export const listCommentsByPostId = queryGeneric({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query("comments")
      .withIndex("by_postId_createdAtTs", (query) => query.eq("postId", args.postId))
      .collect();

    return docs.sort((a, b) => b.createdAtTs - a.createdAtTs).map(mapComment);
  },
});

export const getAdminStats = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").collect();
    const comments = await ctx.db.query("comments").collect();
    const categories = new Set(posts.map((post) => post.category));
    return {
      totalPosts: posts.length,
      publishedPosts: posts.filter((post) => post.status === "published").length,
      totalComments: comments.length,
      categories: categories.size,
    };
  },
});

export const createPost = mutationGeneric({
  args: {
    input: postInputValidator,
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const normalized = normalizePostInput(args.input);
    const slug = await buildUniqueSlug(ctx.db, normalized.slug);

    const id = await ctx.db.insert("posts", {
      ...normalized,
      slug,
      createdAt: now,
      updatedAt: now,
    });

    return { id: String(id) };
  },
});

export const updatePost = mutationGeneric({
  args: {
    id: v.id("posts"),
    input: postInputValidator,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Post not found.");
    }

    const normalized = normalizePostInput(args.input);
    const slug = await buildUniqueSlug(ctx.db, normalized.slug, args.id);

    await ctx.db.patch(args.id, {
      ...normalized,
      slug,
      updatedAt: new Date().toISOString(),
    });

    return { id: String(args.id) };
  },
});

export const addComment = mutationGeneric({
  args: {
    postId: v.id("posts"),
    author: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post || post.status !== "published") {
      throw new Error("Post unavailable for comments.");
    }

    const author = args.author.trim();
    const message = args.message.trim();
    if (!author || !message) {
      throw new Error("Name and comment are required.");
    }

    const now = new Date().toISOString();
    const id = await ctx.db.insert("comments", {
      postId: args.postId,
      author,
      message,
      createdAt: now,
      createdAtTs: Date.parse(now),
    });

    return {
      id: String(id),
      postId: String(args.postId),
      author,
      message,
      createdAt: now,
    };
  },
});

export const addNewsletterSubscriber = mutationGeneric({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email address.");
    }

    const existing = await ctx.db
      .query("newsletterSubscribers")
      .withIndex("by_email", (query) => query.eq("email", email))
      .first();

    if (existing) {
      return { alreadySubscribed: true };
    }

    await ctx.db.insert("newsletterSubscribers", {
      email,
      createdAt: new Date().toISOString(),
    });

    return { alreadySubscribed: false };
  },
});

export const seedDefaults = mutationGeneric({
  args: {
    posts: v.array(postInputValidator),
    comments: v.array(
      v.object({
        id: v.string(),
        postId: v.string(),
        author: v.string(),
        message: v.string(),
        createdAt: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const legacyToConvexPostId = new Map<string, string>();
    let insertedPosts = 0;
    let insertedComments = 0;

    for (const inputPost of args.posts) {
      const normalized = normalizePostInput(inputPost);
      const existing = await ctx.db
        .query("posts")
        .withIndex("by_slug", (query) => query.eq("slug", normalized.slug))
        .first();

      if (existing) {
        if (inputPost.id) {
          legacyToConvexPostId.set(inputPost.id, String(existing._id));
        }
        continue;
      }

      const now = new Date().toISOString();
      const id = await ctx.db.insert("posts", {
        ...normalized,
        createdAt: now,
        updatedAt: now,
      });
      insertedPosts += 1;
      if (inputPost.id) {
        legacyToConvexPostId.set(inputPost.id, String(id));
      }
    }

    for (const inputComment of args.comments) {
      const postId = legacyToConvexPostId.get(inputComment.postId);
      if (!postId) {
        continue;
      }

      const author = inputComment.author.trim();
      const message = inputComment.message.trim();
      if (!author || !message) {
        continue;
      }

      const { iso, ts } = normalizeIsoDatetime(inputComment.createdAt);
      const existingAtTimestamp = await ctx.db
        .query("comments")
        .withIndex("by_postId_createdAtTs", (query) => query.eq("postId", postId))
        .collect();
      const duplicate = existingAtTimestamp.some(
        (item) =>
          item.createdAtTs === ts &&
          item.author === author &&
          item.message === message &&
          item.createdAt === iso,
      );

      if (duplicate) {
        continue;
      }

      await ctx.db.insert("comments", {
        postId,
        author,
        message,
        createdAt: iso,
        createdAtTs: ts,
      });
      insertedComments += 1;
    }

    return {
      insertedPosts,
      insertedComments,
    };
  },
});
