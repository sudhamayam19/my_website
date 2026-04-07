import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getBlogPosts, getPodcastEpisodes } from "@/lib/content-store";
import type { BlogPost, PodcastEpisode } from "@/lib/site-data";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function buildSystemPrompt(): Promise<string> {
  let posts: BlogPost[] = [];
  let podcasts: PodcastEpisode[] = [];

  try {
    const [allPosts, allPodcasts] = await Promise.all([
      getBlogPosts(),
      getPodcastEpisodes(),
    ]);
    posts = allPosts.filter((p) => p.status === "published").slice(0, 6);
    podcasts = allPodcasts.filter((p) => p.status === "published").slice(0, 5);
  } catch {
    // fallback to empty if DB unavailable
  }

  const siteUrl = "https://sudhamayam.vercel.app";

  const postsContext =
    posts.length > 0
      ? posts
          .map(
            (p, i) =>
              `${i + 1}. "${p.title}" (${p.category}, ${new Date(p.publishedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}) — ${p.excerpt}${p.views ? ` · ${p.views} views` : ""}\n   Link: ${siteUrl}/blog/${p.slug}`
          )
          .join("\n")
      : "No published articles yet.";

  const podcastsContext =
    podcasts.length > 0
      ? podcasts
          .map(
            (p, i) =>
              `${i + 1}. "${p.title}" — ${p.showTitle} (${p.durationMinutes} min, ${new Date(p.publishedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}) — ${p.excerpt}${p.listens ? ` · ${p.listens} listens` : ""}\n   Link: ${siteUrl}/podcasts/${p.slug}`
          )
          .join("\n")
      : "No published podcasts yet.";

  return `You are a warm and knowledgeable assistant on Sudha Devarakonda's personal website (sudhamayam.vercel.app).

## About Sudha Devarakonda
- Professional RJ (Radio Jockey), Translator, and Voice Artist based in Hyderabad, India
- 20+ years of experience in Telugu and Hindi broadcasting (started 2005)
- Services: voice-over, narration, dubbing, translation (Telugu ↔ Hindi ↔ English), RJ hosting, podcast production
- YouTube channel: https://youtube.com/@sudhamayam
- Visitors can contact her via the website's contact section

## Latest Blog Articles on the Website
${postsContext}

## Latest Podcast Episodes
${podcastsContext}

## Guidelines
- Be warm, conversational, and enthusiastic about Sudha's work
- When asked about latest content, refer to the lists above with specifics (title, topic, date)
- For booking or inquiries, direct visitors to the contact form on the website
- Keep responses concise (3-5 sentences max)
- ALWAYS end your reply about any article or podcast with: "Read the full article here: [link]" or "Listen to the full episode here: [link]" using the exact link from above
- Do not make up content not mentioned above
- If asked something unrelated to Sudha or her work, politely redirect`;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as { messages: Message[] };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const systemPrompt = await buildSystemPrompt();

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 350,
      system: systemPrompt,
      messages: messages.slice(-10),
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ message: text });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}
