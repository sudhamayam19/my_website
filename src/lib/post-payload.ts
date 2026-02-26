import type { PostInput } from "@/lib/content-store";
import type { PostStatus } from "@/lib/site-data";

interface ParseResult {
  input?: PostInput;
  error?: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sanitizeContent(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

export function parsePostPayload(payload: unknown): ParseResult {
  if (!isObject(payload)) {
    return { error: "Invalid payload." };
  }

  const rawStatus = payload.status;
  const status: PostStatus = rawStatus === "published" ? "published" : "draft";
  const content = sanitizeContent(payload.content);
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const excerpt = typeof payload.excerpt === "string" ? payload.excerpt.trim() : "";
  const category = typeof payload.category === "string" ? payload.category.trim() : "";
  const coverGradient =
    typeof payload.coverGradient === "string"
      ? payload.coverGradient.trim()
      : "from-[#1f6a6d] to-[#4ea59e]";
  const publishedAt =
    typeof payload.publishedAt === "string" && payload.publishedAt.trim().length > 0
      ? payload.publishedAt
      : new Date().toISOString().slice(0, 10);
  const rawReadTime = Number(payload.readTimeMinutes);
  const readTimeMinutes = Number.isFinite(rawReadTime)
    ? Math.max(1, Math.min(30, Math.round(rawReadTime)))
    : 5;
  const featured = Boolean(payload.featured);
  const seoDescription =
    typeof payload.seoDescription === "string"
      ? payload.seoDescription.trim()
      : excerpt;

  if (!title || !excerpt || !category || content.length === 0) {
    return { error: "Title, excerpt, category, and content are required." };
  }

  return {
    input: {
      title,
      excerpt,
      content,
      category,
      publishedAt,
      readTimeMinutes,
      coverGradient,
      status,
      featured,
      seoDescription: seoDescription || excerpt,
    },
  };
}
