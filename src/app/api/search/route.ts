import { getBlogPosts, getPodcastEpisodes } from "@/lib/content-store";
import { NextResponse } from "next/server";

export async function GET() {
  const [posts, episodes] = await Promise.all([
    getBlogPosts(),
    getPodcastEpisodes(),
  ]);

  return NextResponse.json({
    posts: posts.filter((p) => p.status === "published"),
    episodes: episodes.filter((e) => e.status === "published"),
  });
}
