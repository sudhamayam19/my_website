import { NextResponse } from "next/server";
import { getBlogPosts, getPodcastEpisodes } from "@/lib/content-store";

export async function GET() {
  const [allPosts, allPodcasts] = await Promise.all([
    getBlogPosts(),
    getPodcastEpisodes(),
  ]);

  const posts = allPosts.filter((p) => p.status === "published").slice(0, 5);
  const podcasts = allPodcasts.filter((p) => p.status === "published").slice(0, 5);

  return NextResponse.json({ posts, podcasts });
}
