import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/api-auth";
import { createPost } from "@/lib/content-store";

// Executes a Tillu tool call coming from the live voice session.
// Secrets (Serper key, Convex) stay server-side; the browser only relays name+args.

async function serperSearch(query: string): Promise<unknown> {
  const key = process.env.SERPER_API_KEY;
  if (!key) return { error: "Web search not configured." };
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": key, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, num: 5 }),
    });
    const data = await res.json() as {
      answerBox?: { answer?: string; snippet?: string };
      organic?: { title: string; snippet: string; link: string }[];
    };
    return {
      query,
      answer: data.answerBox?.answer ?? data.answerBox?.snippet ?? null,
      results: (data.organic ?? []).slice(0, 5).map((r) => ({ title: r.title, snippet: r.snippet })),
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Search failed" };
  }
}

const GRADIENTS = [
  "from-[#1f6a6d] to-[#4ea59e]", "from-[#9e3d2d] to-[#d38d59]",
  "from-[#3a5a7a] to-[#7aa0c4]", "from-[#6a4a7a] to-[#a98fc4]",
];

export async function POST(req: Request) {
  if (!await isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, args } = await req.json() as { name: string; args: Record<string, string> };

    if (name === "web_search") {
      return NextResponse.json({ result: await serperSearch(args.query) });
    }

    if (name === "save_draft") {
      const paragraphs = (args.content ?? "").split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
      if (paragraphs.length === 0) return NextResponse.json({ result: { error: "No content" } });
      const words = (args.content ?? "").split(/\s+/).filter(Boolean).length;
      const excerpt = (args.excerpt ?? paragraphs[0]).slice(0, 200);
      const { id } = await createPost({
        title: args.title ?? "Untitled draft",
        excerpt,
        content: paragraphs,
        category: args.category ?? "Lifestyle",
        publishedAt: new Date().toISOString(),
        readTimeMinutes: Math.max(1, Math.round(words / 200)),
        coverGradient: GRADIENTS[words % GRADIENTS.length],
        status: "draft",
        featured: false,
        seoDescription: excerpt,
      });
      return NextResponse.json({ result: { saved: true, id, title: args.title } });
    }

    if (name === "add_todo") {
      return NextResponse.json({ result: { added: true, text: args.text, note: "Confirm warmly to Akka that you noted it." } });
    }
    if (name === "set_week_topic") {
      return NextResponse.json({ result: { set: true, topic: args.topic, note: "Confirm the week's topic and suggest a quick plan." } });
    }

    return NextResponse.json({ result: { error: `Unknown tool ${name}` } });
  } catch (e) {
    return NextResponse.json({ result: { error: e instanceof Error ? e.message : "Tool failed" } });
  }
}
