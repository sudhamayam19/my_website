import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const postStatusValidator = v.union(v.literal("published"), v.literal("draft"));
const podcastStatusValidator = v.union(v.literal("published"), v.literal("draft"));
const commentStatusValidator = v.union(
  v.literal("approved"),
  v.literal("pending"),
  v.literal("hidden"),
  v.literal("spam"),
);

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
  coverImageUrl: v.optional(v.string()),
  status: postStatusValidator,
  featured: v.boolean(),
  seoDescription: v.string(),
});

const podcastInputValidator = v.object({
  id: v.optional(v.string()),
  slug: v.optional(v.string()),
  title: v.string(),
  excerpt: v.string(),
  description: v.string(),
  showTitle: v.string(),
  publishedAt: v.string(),
  durationMinutes: v.number(),
  audioUrl: v.string(),
  coverImageUrl: v.optional(v.string()),
  status: podcastStatusValidator,
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
  coverImageUrl?: string;
  status: "published" | "draft";
  featured: boolean;
  seoDescription: string;
  views?: number;
  likes?: number;
}

interface PodcastEpisodeRecord {
  _id: string;
  slug: string;
  title: string;
  excerpt: string;
  description: string;
  showTitle: string;
  publishedAt: string;
  publishedAtTs: number;
  durationMinutes: number;
  audioUrl: string;
  coverImageUrl?: string;
  status: "published" | "draft";
  featured: boolean;
  seoDescription: string;
  listens?: number;
}

interface CommentRecord {
  _id: string;
  postId: string;
  author: string;
  message: string;
  createdAt: string;
  createdAtTs: number;
  adminReply?: string;
  adminReplyAuthor?: string;
  adminReplyAt?: string;
  status?: "approved" | "pending" | "hidden" | "spam";
  parentId?: string;
  authorType?: "user" | "admin";
  likes?: number;
  pinned?: boolean;
  highlighted?: boolean;
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
  coverImageUrl?: string;
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
  const coverImageUrl = input.coverImageUrl?.trim();
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
    coverImageUrl: coverImageUrl && coverImageUrl.length > 0 ? coverImageUrl : undefined,
    status: input.status,
    featured: input.featured,
    seoDescription,
  };
}

function normalizePodcastInput(input: {
  slug?: string;
  title: string;
  excerpt: string;
  description: string;
  showTitle: string;
  publishedAt: string;
  durationMinutes: number;
  audioUrl: string;
  coverImageUrl?: string;
  status: "published" | "draft";
  featured: boolean;
  seoDescription: string;
}) {
  const title = input.title.trim();
  const excerpt = input.excerpt.trim();
  const description = input.description.trim();
  const showTitle = input.showTitle.trim() || "Sudha Devarakonda Podcast";
  const audioUrl = input.audioUrl.trim();
  const seoDescription = input.seoDescription.trim() || excerpt;
  const slug = slugify(input.slug?.trim() || title);
  const durationMinutes = Math.max(1, Math.min(600, Math.round(input.durationMinutes)));
  const coverImageUrl = input.coverImageUrl?.trim();
  const { publishedAt, publishedAtTs } = normalizePublishedAt(input.publishedAt);

  if (!title || !excerpt || !description || !audioUrl) {
    throw new Error("Required podcast fields are missing.");
  }

  return {
    slug,
    title,
    excerpt,
    description,
    showTitle,
    publishedAt,
    publishedAtTs,
    durationMinutes,
    audioUrl,
    coverImageUrl: coverImageUrl && coverImageUrl.length > 0 ? coverImageUrl : undefined,
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

async function buildUniquePodcastSlug(db: unknown, requested: string, currentId?: string) {
  const database = db as {
    query(table: "podcastEpisodes"): {
      withIndex(
        index: "by_slug",
        builder: (query: { eq(field: "slug", value: string): unknown }) => unknown,
      ): {
        first(): Promise<PodcastEpisodeRecord | null>;
      };
    };
  };

  let candidate = requested;
  let suffix = 2;

  for (;;) {
    const existing = await database
      .query("podcastEpisodes")
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
    coverImageUrl: doc.coverImageUrl,
    status: doc.status,
    featured: doc.featured,
    seoDescription: doc.seoDescription,
    views: doc.views ?? 0,
    likes: doc.likes ?? 0,
  };
}

function mapPodcastEpisode(doc: PodcastEpisodeRecord) {
  return {
    id: String(doc._id),
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.excerpt,
    description: doc.description,
    showTitle: doc.showTitle,
    publishedAt: doc.publishedAt,
    durationMinutes: doc.durationMinutes,
    audioUrl: doc.audioUrl,
    coverImageUrl: doc.coverImageUrl,
    status: doc.status,
    featured: doc.featured,
    seoDescription: doc.seoDescription,
    listens: doc.listens ?? 0,
  };
}

function mapComment(doc: CommentRecord) {
  return {
    id: String(doc._id),
    postId: String(doc.postId),
    author: doc.author,
    message: doc.message,
    createdAt: doc.createdAt,
    status: doc.status ?? "approved",
    parentId: doc.parentId ? String(doc.parentId) : undefined,
    authorType: doc.authorType ?? "user",
    likes: doc.likes ?? 0,
    pinned: doc.pinned ?? false,
    highlighted: doc.highlighted ?? false,
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

export const listPodcastEpisodes = queryGeneric({
  args: {
    includeDrafts: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const includeDrafts = args.includeDrafts ?? false;
    const docs = includeDrafts
      ? await ctx.db.query("podcastEpisodes").collect()
      : await ctx.db
          .query("podcastEpisodes")
          .withIndex("by_status_publishedAtTs", (query) =>
            query.eq("status", "published"),
          )
          .collect();

    return docs
      .sort((a, b) => b.publishedAtTs - a.publishedAtTs)
      .map(mapPodcastEpisode);
  },
});

export const listFeaturedPodcastEpisodes = queryGeneric({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(12, args.limit ?? 3));
    const docs = await ctx.db
      .query("podcastEpisodes")
      .withIndex("by_featured_publishedAtTs", (query) => query.eq("featured", true))
      .collect();

    return docs
      .filter((doc) => doc.status === "published")
      .sort((a, b) => b.publishedAtTs - a.publishedAtTs)
      .slice(0, limit)
      .map(mapPodcastEpisode);
  },
});

export const getPodcastEpisodeById = queryGeneric({
  args: {
    id: v.id("podcastEpisodes"),
  },
  handler: async (ctx, args) => {
    const episode = await ctx.db.get(args.id);
    return episode ? mapPodcastEpisode(episode) : null;
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
    includeStatuses: v.optional(v.array(commentStatusValidator)),
  },
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query("comments")
      .withIndex("by_postId_createdAtTs", (query) => query.eq("postId", args.postId))
      .collect();

    const includeStatuses = args.includeStatuses;
    return docs
      .filter((doc) => {
        if (!includeStatuses?.length) {
          return true;
        }

        return includeStatuses.includes(doc.status ?? "approved");
      })
      .sort((a, b) => b.createdAtTs - a.createdAtTs)
      .map(mapComment);
  },
});

export const getAdminStats = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").collect();
    const comments = await ctx.db.query("comments").collect();
    const categories = new Set(posts.map((post) => post.category));
    const totalViews = posts.reduce((sum, post) => sum + (post.views ?? 0), 0);
    return {
      totalPosts: posts.length,
      publishedPosts: posts.filter((post) => post.status === "published").length,
      totalComments: comments.length,
      categories: categories.size,
      pendingComments: comments.filter((comment) => (comment.status ?? "approved") === "pending").length,
      totalViews,
    };
  },
});

export const getTopPostsByViews = queryGeneric({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(20, args.limit ?? 5));
    const docs = await ctx.db
      .query("posts")
      .withIndex("by_status_publishedAtTs", (query) => query.eq("status", "published"))
      .collect();

    return docs
      .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
      .slice(0, limit)
      .map((doc) => ({
        id: String(doc._id),
        title: doc.title,
        category: doc.category,
        views: doc.views ?? 0,
      }));
  },
});

export const incrementPostView = mutationGeneric({
  args: {
    id: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    if (!post || post.status !== "published") {
      return;
    }
    await ctx.db.patch(args.id, {
      views: (post.views ?? 0) + 1,
    });
  },
});

export const incrementPostLike = mutationGeneric({
  args: {
    id: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id);
    if (!post || post.status !== "published") {
      return { likes: 0 };
    }

    const likes = (post.likes ?? 0) + 1;
    await ctx.db.patch(args.id, { likes });
    return { likes };
  },
});

export const incrementPodcastListen = mutationGeneric({
  args: {
    id: v.id("podcastEpisodes"),
  },
  handler: async (ctx, args) => {
    const episode = await ctx.db.get(args.id);
    if (!episode || episode.status !== "published") {
      return { listens: 0 };
    }

    const listens = (episode.listens ?? 0) + 1;
    await ctx.db.patch(args.id, { listens });
    return { listens };
  },
});

export const listAdminDeviceTokens = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const tokens = await ctx.db.query("adminDeviceTokens").collect();
    return tokens.map((item) => ({
      token: item.token,
      platform: item.platform,
    }));
  },
});

export const generateUploadUrl = mutationGeneric({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getStorageUrl = queryGeneric({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
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

export const createPodcastEpisode = mutationGeneric({
  args: {
    input: podcastInputValidator,
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const normalized = normalizePodcastInput(args.input);
    const slug = await buildUniquePodcastSlug(ctx.db, normalized.slug);

    const id = await ctx.db.insert("podcastEpisodes", {
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

export const updatePodcastEpisode = mutationGeneric({
  args: {
    id: v.id("podcastEpisodes"),
    input: podcastInputValidator,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Podcast episode not found.");
    }

    const normalized = normalizePodcastInput(args.input);
    const slug = await buildUniquePodcastSlug(ctx.db, normalized.slug, args.id);

    await ctx.db.patch(args.id, {
      ...normalized,
      slug,
      updatedAt: new Date().toISOString(),
    });

    return { id: String(args.id) };
  },
});

export const deletePost = mutationGeneric({
  args: {
    id: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Post not found.");
    }

    const relatedComments = await ctx.db
      .query("comments")
      .withIndex("by_postId_createdAtTs", (query) => query.eq("postId", args.id))
      .collect();

    for (const comment of relatedComments) {
      await ctx.db.delete(comment._id);
    }

    await ctx.db.delete(args.id);
    return { id: String(args.id), deletedComments: relatedComments.length };
  },
});

export const deletePodcastEpisode = mutationGeneric({
  args: {
    id: v.id("podcastEpisodes"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Podcast episode not found.");
    }

    await ctx.db.delete(args.id);
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
      status: "approved",
    });

    return {
      id: String(id),
      postId: String(args.postId),
      author,
      message,
      createdAt: now,
      status: "approved",
    };
  },
});

export const addAdminReply = mutationGeneric({
  args: {
    postId: v.id("posts"),
    parentId: v.id("comments"),
    message: v.string(),
    adminName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post || post.status !== "published") {
      throw new Error("Post unavailable.");
    }

    const parent = await ctx.db.get(args.parentId);
    if (!parent) {
      throw new Error("Parent comment not found.");
    }

    const message = args.message.trim();
    if (!message) {
      throw new Error("Reply message is required.");
    }

    const author = (args.adminName ?? "Sudha").trim() || "Sudha";
    const now = new Date().toISOString();

    const id = await ctx.db.insert("comments", {
      postId: args.postId,
      author,
      message,
      createdAt: now,
      createdAtTs: Date.parse(now),
      status: "approved",
      parentId: args.parentId,
      authorType: "admin",
    });

    return {
      id: String(id),
      postId: String(args.postId),
      parentId: String(args.parentId),
      author,
      message,
      createdAt: now,
      status: "approved",
      authorType: "admin",
    };
  },
});

export const likeComment = mutationGeneric({
  args: { id: v.id("comments") },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.id);
    if (!comment) throw new Error("Comment not found.");
    const likes = (comment.likes ?? 0) + 1;
    await ctx.db.patch(args.id, { likes });
    return { likes };
  },
});

export const pinComment = mutationGeneric({
  args: { id: v.id("comments"), pinned: v.boolean() },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.id);
    if (!comment) throw new Error("Comment not found.");
    await ctx.db.patch(args.id, { pinned: args.pinned });
    return { id: String(args.id), pinned: args.pinned };
  },
});

export const highlightComment = mutationGeneric({
  args: { id: v.id("comments"), highlighted: v.boolean() },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.id);
    if (!comment) throw new Error("Comment not found.");
    await ctx.db.patch(args.id, { highlighted: args.highlighted });
    return { id: String(args.id), highlighted: args.highlighted };
  },
});

export const updateCommentStatus = mutationGeneric({
  args: {
    id: v.id("comments"),
    status: commentStatusValidator,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Comment not found.");
    }

    await ctx.db.patch(args.id, {
      status: args.status,
    });

    return {
      id: String(args.id),
      postId: String(existing.postId),
      status: args.status,
    };
  },
});

export const deleteComment = mutationGeneric({
  args: {
    id: v.id("comments"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Comment not found.");
    }

    await ctx.db.delete(args.id);
    return { id: String(args.id), postId: String(existing.postId) };
  },
});

export const registerAdminDeviceToken = mutationGeneric({
  args: {
    token: v.string(),
    platform: v.string(),
  },
  handler: async (ctx, args) => {
    const token = args.token.trim();
    const platform = args.platform.trim() || "unknown";
    if (!token) {
      throw new Error("Push token is required.");
    }

    const existing = await ctx.db
      .query("adminDeviceTokens")
      .withIndex("by_token", (query) => query.eq("token", token))
      .first();

    const now = new Date().toISOString();
    if (existing) {
      await ctx.db.patch(existing._id, {
        platform,
        updatedAt: now,
      });

      return {
        token,
        platform,
      };
    }

    await ctx.db.insert("adminDeviceTokens", {
      token,
      platform,
      createdAt: now,
      updatedAt: now,
    });

    return {
      token,
      platform,
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
        status: v.optional(commentStatusValidator),
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
        status: inputComment.status ?? "approved",
      });
      insertedComments += 1;
    }

    return {
      insertedPosts,
      insertedComments,
    };
  },
});
