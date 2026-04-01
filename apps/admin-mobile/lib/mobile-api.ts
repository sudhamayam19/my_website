import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "admin_mobile_token";
const DEFAULT_API_BASE_URL = "https://sudhamayam.vercel.app";
export type MobileCommentStatus = "approved" | "pending" | "hidden" | "spam";

export interface MobilePost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  category: string;
  publishedAt: string;
  readTimeMinutes: number;
  coverGradient: string;
  coverImageUrl?: string;
  status: "draft" | "published";
  featured: boolean;
  seoDescription: string;
}

export interface MobileComment {
  id: string;
  postId: string;
  postTitle?: string;
  author: string;
  message: string;
  createdAt: string;
  status: MobileCommentStatus;
  parentId?: string;
  authorType?: "user" | "admin";
  adminReply?: string;
  adminReplyAuthor?: string;
  adminReplyAt?: string;
}

export interface MobileTopPost {
  id: string;
  title: string;
  category: string;
  views: number;
}

export interface MobileDashboardResponse {
  stats: {
    totalPosts: number;
    publishedPosts: number;
    totalComments: number;
    categories: number;
    pendingComments: number;
    totalViews: number;
  };
  recentPosts: MobilePost[];
  recentComments: MobileComment[];
  topPosts: MobileTopPost[];
}

function getApiBaseUrl(): string {
  const value = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;
  return value.replace(/\/$/, "");
}

async function getToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function hasToken(): Promise<boolean> {
  return Boolean(await getToken());
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
  const headers = new Headers(init?.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!(init?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });

  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
}

export async function signIn(username: string, password: string): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}/api/mobile/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const data = (await response.json()) as { token?: string; error?: string };
  if (!response.ok || !data.token) {
    throw new Error(data.error || "Unable to sign in.");
  }

  await saveToken(data.token);
}

export async function fetchDashboard(): Promise<MobileDashboardResponse> {
  return await apiRequest<MobileDashboardResponse>("/api/mobile/dashboard", {
    method: "GET",
  });
}

export async function fetchPosts(): Promise<MobilePost[]> {
  const data = await apiRequest<{ posts: MobilePost[] }>("/api/mobile/posts", {
    method: "GET",
  });
  return data.posts;
}

export async function fetchComments(): Promise<MobileComment[]> {
  const data = await apiRequest<{ comments: MobileComment[] }>("/api/mobile/comments", {
    method: "GET",
  });
  return data.comments;
}

export async function deletePost(id: string): Promise<void> {
  await apiRequest<{ post: { id: string } }>(`/api/mobile/posts/${id}`, {
    method: "DELETE",
  });
}

export async function deleteComment(id: string): Promise<void> {
  await apiRequest<{ comment: { id: string } }>(`/api/mobile/comments/${id}`, {
    method: "DELETE",
  });
}

export async function updateCommentStatus(
  id: string,
  status: MobileCommentStatus,
): Promise<void> {
  await apiRequest<{ comment: { id: string; status: MobileCommentStatus } }>(
    `/api/mobile/comments/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
}

export async function replyToComment(
  commentId: string,
  postId: string,
  message: string,
): Promise<MobileComment> {
  const data = await apiRequest<{ reply: MobileComment }>(`/api/mobile/comments/${commentId}`, {
    method: "POST",
    body: JSON.stringify({ postId, message }),
  });
  return data.reply;
}

export async function registerPushToken(token: string, platform: string): Promise<void> {
  await apiRequest<{ registration: { token: string } }>("/api/mobile/push-tokens", {
    method: "POST",
    body: JSON.stringify({ token, platform }),
  });
}

export async function uploadImage(fileUri: string, fileName: string, mimeType = "image/jpeg"): Promise<string> {
  const formData = new FormData();
  formData.append("file", {
    uri: fileUri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);

  const data = await apiRequest<{ url: string }>("/api/admin/uploads", {
    method: "POST",
    body: formData,
  });
  return data.url;
}

export async function savePost(input: {
  id?: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  readTimeMinutes: number;
  status: "draft" | "published";
  featured: boolean;
  coverGradient: string;
  coverImageUrl?: string;
  seoDescription: string;
  content: string[];
}): Promise<{ id: string }> {
  const path = input.id ? `/api/mobile/posts/${input.id}` : "/api/mobile/posts";
  const method = input.id ? "PATCH" : "POST";
  const data = await apiRequest<{ post: { id: string } }>(path, {
    method,
    body: JSON.stringify(input),
  });
  return data.post;
}
