import type { MetadataRoute } from "next";
import { getBlogPosts, getPodcastEpisodes } from "@/lib/content-store";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sudhamayam.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = ["", "/about", "/blog", "/podcasts", "/media", "/gallery", "/contact", "/privacy-policy"].map(
    (path) => ({
      url: `${BASE}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
    }),
  );

  let dynamicPages: MetadataRoute.Sitemap = [];
  try {
    const [posts, episodes] = await Promise.all([getBlogPosts(false), getPodcastEpisodes(false)]);
    dynamicPages = [
      ...posts.map((p) => ({ url: `${BASE}/blog/${p.id}`, lastModified: new Date(p.publishedAt), changeFrequency: "monthly" as const, priority: 0.6 })),
      ...episodes.map((e) => ({ url: `${BASE}/podcasts/${e.id}`, lastModified: new Date(e.publishedAt), changeFrequency: "monthly" as const, priority: 0.6 })),
    ];
  } catch {
    /* fall back to static pages only */
  }

  return [...staticPages, ...dynamicPages];
}
