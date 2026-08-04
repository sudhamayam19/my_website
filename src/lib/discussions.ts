import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";

const api = anyApi;

export interface DiscussionTopic {
  id: string;
  title: string;
  body: string;
  guidelines: string;
  imageUrl: string;
  author: string;
  category: string;
  createdAt: string;
  replyCount: number;
  status: "approved" | "hidden" | "spam";
  pinned: boolean;
}

export interface DiscussionReply {
  id: string;
  author: string;
  message: string;
  createdAt: string;
  authorType: "user" | "admin";
}

export type DiscussionTopicDetail = DiscussionTopic & { replies: DiscussionReply[] };

function getClient(): ConvexHttpClient | null {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.NEXT_CONVEX_PUBLIC_URL;
  return url ? new ConvexHttpClient(url) : null;
}

function requireClient(): ConvexHttpClient {
  const client = getClient();
  if (!client) {
    throw new Error("Discussions are unavailable. Set NEXT_PUBLIC_CONVEX_URL and redeploy.");
  }
  return client;
}

export async function getDiscussionTopics(includeHidden = false): Promise<DiscussionTopic[]> {
  const client = getClient();
  if (!client) return [];
  try {
    return (await client.query(api.discussions.listTopics, { includeHidden })) as DiscussionTopic[];
  } catch {
    return [];
  }
}

export async function getDiscussionTopic(id: string): Promise<DiscussionTopicDetail | null> {
  const client = getClient();
  if (!client) return null;
  try {
    return (await client.query(api.discussions.getTopic, { id })) as DiscussionTopicDetail | null;
  } catch {
    return null;
  }
}

export async function createDiscussionTopic(input: {
  title: string;
  body: string;
  guidelines?: string;
  imageUrl?: string;
  author: string;
  category?: string;
}): Promise<{ id: string }> {
  return await requireClient().mutation(api.discussions.createTopic, input);
}

export async function addDiscussionReply(input: {
  topicId: string;
  author: string;
  message: string;
  authorType?: "user" | "admin";
}): Promise<{ id: string; author: string; message: string; createdAt: string }> {
  return await requireClient().mutation(api.discussions.addReply, input);
}

export async function updateDiscussionTopicStatus(
  id: string,
  status: "approved" | "hidden" | "spam",
): Promise<void> {
  await requireClient().mutation(api.discussions.updateTopicStatus, { id, status });
}

export async function deleteDiscussionTopic(id: string): Promise<void> {
  await requireClient().mutation(api.discussions.deleteTopic, { id });
}
