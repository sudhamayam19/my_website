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
    throw new Error(
      "NEXT_PUBLIC_CONVEX_URL is missing. Set it in your environment to enable Convex persistence.",
    );
  }
  return new ConvexHttpClient(deploymentUrl);
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

export async function getBlogPosts(options?: {
  includeDrafts?: boolean;
}): Promise<BlogPost[]> {
  const client = getConvexClient();
  await ensureSeeded(client);
  return await client.query(api.content.listPosts, {
    includeDrafts: options?.includeDrafts ?? false,
  });
}

export async function getFeaturedPosts(limit = 3): Promise<BlogPost[]> {
  const client = getConvexClient();
  await ensureSeeded(client);
  return await client.query(api.content.listFeaturedPosts, { limit });
}

export async function getBlogPostById(id: string): Promise<BlogPost | undefined> {
  const client = getConvexClient();
  await ensureSeeded(client);
  try {
    const post = await client.query(api.content.getPostById, { id });
    return post ?? undefined;
  } catch {
    return undefined;
  }
}

export async function getBlogCategories(): Promise<string[]> {
  const client = getConvexClient();
  await ensureSeeded(client);
  return await client.query(api.content.listCategories, {});
}

export async function getCommentsByPostId(postId: string): Promise<BlogComment[]> {
  const client = getConvexClient();
  await ensureSeeded(client);
  try {
    return await client.query(api.content.listCommentsByPostId, { postId });
  } catch {
    return [];
  }
}

export async function getAdminStats(): Promise<BlogStats> {
  const client = getConvexClient();
  await ensureSeeded(client);
  return await client.query(api.content.getAdminStats, {});
}

export async function createPost(input: PostInput): Promise<{ id: string }> {
  const client = getConvexClient();
  await ensureSeeded(client);
  return await client.mutation(api.content.createPost, { input });
}

export async function updatePost(id: string, input: PostInput): Promise<{ id: string }> {
  const client = getConvexClient();
  await ensureSeeded(client);
  return await client.mutation(api.content.updatePost, { id, input });
}

export async function addComment(input: {
  postId: string;
  author: string;
  message: string;
}): Promise<BlogComment> {
  const client = getConvexClient();
  await ensureSeeded(client);
  return await client.mutation(api.content.addComment, input);
}

export async function addNewsletterSubscriber(email: string): Promise<{ alreadySubscribed: boolean }> {
  const client = getConvexClient();
  await ensureSeeded(client);
  return await client.mutation(api.content.addNewsletterSubscriber, { email });
}
