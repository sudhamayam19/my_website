import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import {
  defaultDailyDose,
  defaultBlogComments,
  defaultBlogPosts,
  defaultPodcastEpisodes,
  type BlogComment,
  type BlogPost,
  type CommentStatus,
  type DailyDose,
  type DailyDoseStyle,
  type PodcastEpisode,
  type PodcastStatus,
  type PostStatus,
} from "@/lib/site-data";

const api = anyApi;

export interface BlogStats {
  totalPosts: number;
  publishedPosts: number;
  totalComments: number;
  categories: number;
  pendingComments: number;
  totalViews: number;
}

export interface TopPost {
  id: string;
  title: string;
  category: string;
  views: number;
}

export interface PostInput {
  title: string;
  excerpt: string;
  content: string[];
  category: string;
  publishedAt: string;
  readTimeMinutes: number;
  coverGradient: string;
  coverImageUrl?: string;
  status: PostStatus;
  featured: boolean;
  seoDescription: string;
}

export interface PodcastEpisodeInput {
  title: string;
  excerpt: string;
  description: string;
  showTitle: string;
  publishedAt: string;
  durationMinutes: number;
  audioUrl: string;
  coverImageUrl?: string;
  status: PodcastStatus;
  featured: boolean;
  seoDescription: string;
}

export interface DailyDoseInput {
  text: string;
  author?: string;
  active: boolean;
  style: DailyDoseStyle;
}

let seedPromise: Promise<void> | null = null;

function getConvexClient() {
  const deploymentUrl =
    process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.NEXT_CONVEX_PUBLIC_URL;
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

function sortPodcastEpisodes(data: PodcastEpisode[]): PodcastEpisode[] {
  return [...data].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

function getFallbackPodcastEpisodes(options?: { includeDrafts?: boolean }): PodcastEpisode[] {
  const includeDrafts = options?.includeDrafts ?? false;
  const list = includeDrafts
    ? defaultPodcastEpisodes
    : defaultPodcastEpisodes.filter((episode) => episode.status === "published");
  return sortPodcastEpisodes(list);
}

function getFallbackDailyDose(): DailyDose {
  return { ...defaultDailyDose };
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

export async function getPodcastEpisodes(options?: {
  includeDrafts?: boolean;
}): Promise<PodcastEpisode[]> {
  const client = getConvexClient();
  if (!client) {
    return getFallbackPodcastEpisodes(options);
  }

  const isReady = await tryEnsureSeeded(client);
  if (!isReady) {
    return getFallbackPodcastEpisodes(options);
  }

  try {
    return await client.query(api.content.listPodcastEpisodes, {
      includeDrafts: options?.includeDrafts ?? false,
    });
  } catch {
    return getFallbackPodcastEpisodes(options);
  }
}

export async function getFeaturedPodcastEpisodes(limit = 3): Promise<PodcastEpisode[]> {
  const client = getConvexClient();
  if (!client) {
    return getFallbackPodcastEpisodes().filter((episode) => episode.featured).slice(0, limit);
  }

  const isReady = await tryEnsureSeeded(client);
  if (!isReady) {
    return getFallbackPodcastEpisodes().filter((episode) => episode.featured).slice(0, limit);
  }

  try {
    return await client.query(api.content.listFeaturedPodcastEpisodes, { limit });
  } catch {
    return getFallbackPodcastEpisodes().filter((episode) => episode.featured).slice(0, limit);
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

export async function getPodcastEpisodeById(id: string): Promise<PodcastEpisode | undefined> {
  const client = getConvexClient();
  if (!client) {
    return defaultPodcastEpisodes.find((episode) => episode.id === id);
  }

  const isReady = await tryEnsureSeeded(client);
  if (!isReady) {
    return defaultPodcastEpisodes.find((episode) => episode.id === id);
  }

  try {
    const episode = await client.query(api.content.getPodcastEpisodeById, { id });
    return episode ?? undefined;
  } catch {
    return defaultPodcastEpisodes.find((episode) => episode.id === id);
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

export async function getCommentsByPostId(
  postId: string,
  options?: {
    includeStatuses?: CommentStatus[];
  },
): Promise<BlogComment[]> {
  const client = getConvexClient();
  const includeStatuses = options?.includeStatuses ?? ["approved"];
  const filterFallback = (comments: BlogComment[]) =>
    includeStatuses?.length
      ? comments.filter((comment) => includeStatuses.includes(comment.status))
      : comments;

  if (!client) {
    return filterFallback(getFallbackComments(postId));
  }

  const isReady = await tryEnsureSeeded(client);
  if (!isReady) {
    return filterFallback(getFallbackComments(postId));
  }

  try {
    return await client.query(api.content.listCommentsByPostId, { postId, includeStatuses });
  } catch {
    return filterFallback(getFallbackComments(postId));
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
      pendingComments: defaultBlogComments.filter((comment) => comment.status === "pending").length,
      totalViews: 0,
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
      pendingComments: defaultBlogComments.filter((comment) => comment.status === "pending").length,
      totalViews: 0,
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
      pendingComments: defaultBlogComments.filter((comment) => comment.status === "pending").length,
      totalViews: 0,
    };
  }
}

export async function getTopPostsByViews(limit = 5): Promise<TopPost[]> {
  const client = getConvexClient();
  if (!client) {
    return [];
  }

  const isReady = await tryEnsureSeeded(client);
  if (!isReady) {
    return [];
  }

  try {
    return await client.query(api.content.getTopPostsByViews, { limit });
  } catch {
    return [];
  }
}

export async function incrementPostView(id: string): Promise<void> {
  const client = getConvexClient();
  if (!client) {
    return;
  }

  try {
    await client.mutation(api.content.incrementPostView, { id });
  } catch {
    // silently ignore view tracking errors
  }
}

export async function incrementPostLike(id: string): Promise<number> {
  const client = getConvexClient();
  if (!client) {
    return 0;
  }

  try {
    const result = await client.mutation(api.content.incrementPostLike, { id });
    return result.likes ?? 0;
  } catch {
    return 0;
  }
}

export async function incrementPodcastListen(id: string): Promise<number> {
  const client = getConvexClient();
  if (!client) {
    return 0;
  }

  try {
    const result = await client.mutation(api.content.incrementPodcastListen, { id });
    return result.listens ?? 0;
  } catch {
    return 0;
  }
}

export async function getDailyDose(): Promise<DailyDose> {
  const client = getConvexClient();
  if (!client) {
    return getFallbackDailyDose();
  }

  const isReady = await tryEnsureSeeded(client);
  if (!isReady) {
    return getFallbackDailyDose();
  }

  try {
    const dose = await client.query(api.content.getDailyDose, {});
    return dose ?? getFallbackDailyDose();
  } catch {
    return getFallbackDailyDose();
  }
}

export async function createPost(input: PostInput): Promise<{ id: string }> {
  const client = ensureConvexForWrites(getConvexClient());
  return await client.mutation(api.content.createPost, { input });
}

export async function createPodcastEpisode(
  input: PodcastEpisodeInput,
): Promise<{ id: string }> {
  const client = ensureConvexForWrites(getConvexClient());
  return await client.mutation(api.content.createPodcastEpisode, { input });
}

export async function updatePost(id: string, input: PostInput): Promise<{ id: string }> {
  const client = ensureConvexForWrites(getConvexClient());
  return await client.mutation(api.content.updatePost, { id, input });
}

export async function updatePodcastEpisode(
  id: string,
  input: PodcastEpisodeInput,
): Promise<{ id: string }> {
  const client = ensureConvexForWrites(getConvexClient());
  return await client.mutation(api.content.updatePodcastEpisode, { id, input });
}

export async function deletePost(id: string): Promise<{ id: string; deletedComments: number }> {
  const client = ensureConvexForWrites(getConvexClient());
  return await client.mutation(api.content.deletePost, { id });
}

export async function deletePodcastEpisode(id: string): Promise<{ id: string }> {
  const client = ensureConvexForWrites(getConvexClient());
  return await client.mutation(api.content.deletePodcastEpisode, { id });
}

export async function deleteComment(id: string): Promise<{ id: string; postId: string }> {
  const client = ensureConvexForWrites(getConvexClient());
  return await client.mutation(api.content.deleteComment, { id });
}

export async function updateCommentStatus(
  id: string,
  status: CommentStatus,
): Promise<{ id: string; postId: string; status: CommentStatus }> {
  const client = ensureConvexForWrites(getConvexClient());
  return await client.mutation(api.content.updateCommentStatus, { id, status });
}

export async function registerAdminPushToken(
  token: string,
  platform: string,
): Promise<{ token: string; platform: string }> {
  const client = ensureConvexForWrites(getConvexClient());
  return await client.mutation(api.content.registerAdminDeviceToken, { token, platform });
}

export async function getAdminPushTokens(): Promise<string[]> {
  const client = getConvexClient();
  if (!client) {
    return [];
  }

  const isReady = await tryEnsureSeeded(client);
  if (!isReady) {
    return [];
  }

  try {
    const tokens = await client.query(api.content.listAdminDeviceTokens, {});
    return tokens.map((item: { token: string }) => item.token);
  } catch {
    return [];
  }
}

export async function addComment(input: {
  postId: string;
  author: string;
  message: string;
}): Promise<BlogComment> {
  const client = ensureConvexForWrites(getConvexClient());
  return await client.mutation(api.content.addComment, input);
}

export async function saveDailyDose(input: DailyDoseInput): Promise<DailyDose> {
  const client = ensureConvexForWrites(getConvexClient());
  return await client.mutation(api.content.saveDailyDose, { input });
}

export async function addNewsletterSubscriber(email: string): Promise<{ alreadySubscribed: boolean }> {
  const client = ensureConvexForWrites(getConvexClient());
  return await client.mutation(api.content.addNewsletterSubscriber, { email });
}

export async function getNewsletterSubscribers(): Promise<{ email: string; createdAt: string }[]> {
  const client = ensureConvexForWrites(getConvexClient());
  return await client.query(api.content.getNewsletterSubscribers, {});
}

export async function likeComment(id: string): Promise<number> {
  const client = ensureConvexForWrites(getConvexClient());
  const result = await client.mutation(api.content.likeComment, { id });
  return result.likes ?? 0;
}

export async function pinComment(id: string, pinned: boolean): Promise<void> {
  const client = ensureConvexForWrites(getConvexClient());
  await client.mutation(api.content.pinComment, { id, pinned });
}

export async function highlightComment(id: string, highlighted: boolean): Promise<void> {
  const client = ensureConvexForWrites(getConvexClient());
  await client.mutation(api.content.highlightComment, { id, highlighted });
}

export async function addAdminReply(input: {
  postId: string;
  parentId: string;
  message: string;
  adminName?: string;
}): Promise<BlogComment> {
  const client = ensureConvexForWrites(getConvexClient());
  return await client.mutation(api.content.addAdminReply, input);
}
