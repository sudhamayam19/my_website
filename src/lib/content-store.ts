import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import {
  defaultBlogComments,
  defaultBlogPosts,
  type BlogComment,
  type BlogPost,
  type PostStatus,
} from "@/lib/site-data";

const api = anyApi;

export interface BlogStats {
  totalPosts: number;
  publishedPosts: number;
  totalComments: number;
  categories: number;
}

export interface PostInput {
  title: string;
  excerpt: string;
  content: string[];
  category: string;
  publishedAt: string;
  readTimeMinutes: number;
  coverGradient: string;
  status: PostStatus;
  featured: boolean;
  seoDescription: string;
}

let seedPromise: Promise<void> | null = null;

function getConvexClient() {
  const deploymentUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!deploymentUrl) {
    return null;
  }
  return new ConvexHttpClient(deploymentUrl);
}

function sortByPublishedDate(data: BlogPost[]): BlogPost[] {
  return [...data].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

function getFallbackPosts(options?: { includeDrafts?: boolean }): BlogPost[] {
  const includeDrafts = options?.includeDrafts ?? false;
  const list = includeDrafts
    ? defaultBlogPosts
    : defaultBlogPosts.filter((post) => post.status === "published");
  return sortByPublishedDate(list);
}

function getFallbackComments(postId: string): BlogComment[] {
  return [...defaultBlogComments]
    .filter((comment) => comment.postId === postId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function ensureConvexForWrites(client: ConvexHttpClient | null): ConvexHttpClient {
  if (!client) {
    throw new Error(
      "Persistence is unavailable. Set NEXT_PUBLIC_CONVEX_URL in Vercel and redeploy.",
    );
  }
  return client;
}

async function ensureSeeded(client: ConvexHttpClient) {
  if (seedPromise) {
    return seedPromise;
  }

  seedPromise = client
    .mutation(api.content.seedDefaults, {
      posts: defaultBlogPosts,
      comments: defaultBlogComments,
    })
    .then(() => undefined)
    .catch((error) => {
      seedPromise = null;
      throw error;
    });

  return seedPromise;
}

async function tryEnsureSeeded(client: ConvexHttpClient): Promise<boolean> {
  try {
    await ensureSeeded(client);
    return true;
  } catch {
    return false;
  }
}

export async function getBlogPosts(options?: {
  includeDrafts?: boolean;
}): Promise<BlogPost[]> {
  const client = getConvexClient();
  if (!client) {
    return getFallbackPosts(options);
  }

  const isReady = await tryEnsureSeeded(client);
  if (!isReady) {
    return getFallbackPosts(options);
  }

  try {
    return await client.query(api.content.listPosts, {
      includeDrafts: options?.includeDrafts ?? false,
    });
  } catch {
    return getFallbackPosts(options);
  }
}

export async function getFeaturedPosts(limit = 3): Promise<BlogPost[]> {
  const client = getConvexClient();
  if (!client) {
    return getFallbackPosts().filter((post) => post.featured).slice(0, limit);
  }

  const isReady = await tryEnsureSeeded(client);
  if (!isReady) {
    return getFallbackPosts().filter((post) => post.featured).slice(0, limit);
  }

  try {
    return await client.query(api.content.listFeaturedPosts, { limit });
  } catch {
    return getFallbackPosts().filter((post) => post.featured).slice(0, limit);
  }
}

export async function getBlogPostById(id: string): Promise<BlogPost | undefined> {
  const client = getConvexClient();
  if (!client) {
    return defaultBlogPosts.find((post) => post.id === id);
  }

  const isReady = await tryEnsureSeeded(client);
  if (!isReady) {
    return defaultBlogPosts.find((post) => post.id === id);
  }

  try {
    const post = await client.query(api.content.getPostById, { id });
    return post ?? undefined;
  } catch {
    return defaultBlogPosts.find((post) => post.id === id);
  }
}

export async function getBlogCategories(): Promise<string[]> {
  const client = getConvexClient();
  if (!client) {
    return Array.from(new Set(getFallbackPosts().map((post) => post.category)));
  }

  const isReady = await tryEnsureSeeded(client);
  if (!isReady) {
    return Array.from(new Set(getFallbackPosts().map((post) => post.category)));
  }

  try {
    return await client.query(api.content.listCategories, {});
  } catch {
    return Array.from(new Set(getFallbackPosts().map((post) => post.category)));
  }
}

export async function getCommentsByPostId(postId: string): Promise<BlogComment[]> {
  const client = getConvexClient();
  if (!client) {
    return getFallbackComments(postId);
  }

  const isReady = await tryEnsureSeeded(client);
  if (!isReady) {
    return getFallbackComments(postId);
  }

  try {
    return await client.query(api.content.listCommentsByPostId, { postId });
  } catch {
    return getFallbackComments(postId);
  }
}

export async function getAdminStats(): Promise<BlogStats> {
  const client = getConvexClient();
  if (!client) {
    const allPosts = getFallbackPosts({ includeDrafts: true });
    return {
      totalPosts: allPosts.length,
      publishedPosts: allPosts.filter((post) => post.status === "published").length,
      totalComments: defaultBlogComments.length,
      categories: Array.from(new Set(allPosts.map((post) => post.category))).length,
    };
  }

  const isReady = await tryEnsureSeeded(client);
  if (!isReady) {
    const allPosts = getFallbackPosts({ includeDrafts: true });
    return {
      totalPosts: allPosts.length,
      publishedPosts: allPosts.filter((post) => post.status === "published").length,
      totalComments: defaultBlogComments.length,
      categories: Array.from(new Set(allPosts.map((post) => post.category))).length,
    };
  }

  try {
    return await client.query(api.content.getAdminStats, {});
  } catch {
    const allPosts = getFallbackPosts({ includeDrafts: true });
    return {
      totalPosts: allPosts.length,
      publishedPosts: allPosts.filter((post) => post.status === "published").length,
      totalComments: defaultBlogComments.length,
      categories: Array.from(new Set(allPosts.map((post) => post.category))).length,
    };
  }
}

export async function createPost(input: PostInput): Promise<{ id: string }> {
  const client = ensureConvexForWrites(getConvexClient());
  return await client.mutation(api.content.createPost, { input });
}

export async function updatePost(id: string, input: PostInput): Promise<{ id: string }> {
  const client = ensureConvexForWrites(getConvexClient());
  return await client.mutation(api.content.updatePost, { id, input });
}

export async function addComment(input: {
  postId: string;
  author: string;
  message: string;
}): Promise<BlogComment> {
  const client = ensureConvexForWrites(getConvexClient());
  return await client.mutation(api.content.addComment, input);
}

export async function addNewsletterSubscriber(email: string): Promise<{ alreadySubscribed: boolean }> {
  const client = ensureConvexForWrites(getConvexClient());
  return await client.mutation(api.content.addNewsletterSubscriber, { email });
}
