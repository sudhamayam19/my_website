import { getPodcastEpisodes } from "@/lib/content-store";
import { NextResponse } from "next/server";

const SITE = "https://sudhamayam.vercel.app";
const SHOW_TITLE = "Sudha Devarakonda Podcast";
const SHOW_DESCRIPTION =
  "Conversations on spirituality, wellness, and conscious living by Sudha Devarakonda — covering Vedic wisdom, yoga, meditation, and life's deeper questions.";
const SHOW_AUTHOR = "Sudha Devarakonda";
const SHOW_EMAIL = "sudha@sudhamayam.vercel.app";
const SHOW_LANGUAGE = "en-in";
const SHOW_CATEGORY = "Society &amp; Culture";
const SHOW_IMAGE = `${SITE}/og-image.jpg`;

function escapeXml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc2822(dateStr: string) {
  // dateStr is YYYY-MM-DD; treat as noon UTC to avoid TZ-off-by-one issues
  const d = new Date(`${dateStr}T12:00:00Z`);
  return d.toUTCString();
}

export async function GET() {
  const episodes = await getPodcastEpisodes();
  const published = episodes.filter((e) => e.status === "published");

  const items = published
    .map((ep) => {
      const url = `${SITE}/podcasts/${ep.id}`;
      const cover = ep.coverImageUrl ?? SHOW_IMAGE;
      const durationSecs = ep.durationMinutes * 60;
      return `
    <item>
      <title>${escapeXml(ep.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(ep.excerpt)}</description>
      <pubDate>${toRfc2822(ep.publishedAt)}</pubDate>
      <enclosure url="${escapeXml(ep.audioUrl)}" type="audio/mpeg" length="0"/>
      <itunes:title>${escapeXml(ep.title)}</itunes:title>
      <itunes:summary>${escapeXml(ep.description || ep.excerpt)}</itunes:summary>
      <itunes:duration>${durationSecs}</itunes:duration>
      <itunes:image href="${escapeXml(cover)}"/>
      <itunes:episodeType>full</itunes:episodeType>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SHOW_TITLE}</title>
    <link>${SITE}/podcasts</link>
    <atom:link href="${SITE}/api/podcast/feed.xml" rel="self" type="application/rss+xml"/>
    <description>${SHOW_DESCRIPTION}</description>
    <language>${SHOW_LANGUAGE}</language>
    <itunes:author>${SHOW_AUTHOR}</itunes:author>
    <itunes:owner>
      <itunes:name>${SHOW_AUTHOR}</itunes:name>
      <itunes:email>${SHOW_EMAIL}</itunes:email>
    </itunes:owner>
    <itunes:image href="${SHOW_IMAGE}"/>
    <itunes:category text="${SHOW_CATEGORY}"/>
    <itunes:explicit>false</itunes:explicit>
    <image>
      <url>${SHOW_IMAGE}</url>
      <title>${SHOW_TITLE}</title>
      <link>${SITE}/podcasts</link>
    </image>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=600",
    },
  });
}
