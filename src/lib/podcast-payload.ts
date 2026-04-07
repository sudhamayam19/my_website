import type { PodcastEpisodeInput } from "@/lib/content-store";
import type { PodcastStatus } from "@/lib/site-data";

interface ParseResult {
  input?: PodcastEpisodeInput;
  error?: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parsePodcastPayload(payload: unknown): ParseResult {
  if (!isObject(payload)) {
    return { error: "Invalid payload." };
  }

  const rawStatus = payload.status;
  const status: PodcastStatus = rawStatus === "published" ? "published" : "draft";
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const excerpt = typeof payload.excerpt === "string" ? payload.excerpt.trim() : "";
  const description =
    typeof payload.description === "string" ? payload.description.trim() : "";
  const showTitle =
    typeof payload.showTitle === "string" && payload.showTitle.trim().length > 0
      ? payload.showTitle.trim()
      : "Sudha Devarakonda Podcast";
  const publishedAt =
    typeof payload.publishedAt === "string" && payload.publishedAt.trim().length > 0
      ? payload.publishedAt
      : new Date().toISOString().slice(0, 10);
  const rawDuration = Number(payload.durationMinutes);
  const durationMinutes = Number.isFinite(rawDuration)
    ? Math.max(1, Math.min(600, Math.round(rawDuration)))
    : 20;
  const audioUrl =
    typeof payload.audioUrl === "string" ? payload.audioUrl.trim() : "";
  const coverImageUrl =
    typeof payload.coverImageUrl === "string" && payload.coverImageUrl.trim().length > 0
      ? payload.coverImageUrl.trim()
      : undefined;
  const featured = Boolean(payload.featured);
  const seoDescription =
    typeof payload.seoDescription === "string"
      ? payload.seoDescription.trim()
      : excerpt;

  if (!title || !excerpt || !description || !audioUrl) {
    return {
      error: "Title, excerpt, description, and audio are required.",
    };
  }

  return {
    input: {
      title,
      excerpt,
      description,
      showTitle,
      publishedAt,
      durationMinutes,
      audioUrl,
      coverImageUrl,
      status,
      featured,
      seoDescription: seoDescription || excerpt,
    },
  };
}
