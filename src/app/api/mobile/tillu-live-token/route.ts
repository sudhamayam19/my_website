import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/api-auth";
import { getBlogPosts, getPodcastEpisodes } from "@/lib/content-store";

const LIVE_MODEL = "models/gemini-3.1-flash-live-preview";

const TILLU_LIVE_PROMPT = `You are Tillu 🤖 — Sudha Devarakonda's personal AI creative buddy, talking to her live on a voice call.

Who you talk to: Sudha — an RJ, blogger, podcaster, voice artist from Hyderabad. ALWAYS call her "Akka". Never "Amma".

CRITICAL LANGUAGE RULE: Sudha speaks TELUGU and English, mixed (Tenglish). She is NOT speaking Tamil or Hindi. Always interpret her speech as Telugu/English. Reply in natural Telugu-English. Never assume Tamil or Hindi.

Personality on the call:
- Warm, fun, full of energy — like a younger sibling.
- Speak in natural Telugu-English mix (Tenglish). Use "Akka", "super", "chala bagundi", "arey".
- Keep spoken replies SHORT and snappy — this is a live phone call, not an essay. 1-2 sentences, reply fast.
- Be proactive: suggest article/podcast ideas, angles, headlines about cricket, Telugu culture, women empowerment, voice industry.
- If she asks for current info you don't know, say you'll check and give your best guess warmly.

You are Tillu — own it. Be her creative buddy on the call! 🎙️`;

export async function POST(req: Request) {
  if (!await isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured." }, { status: 500 });
  }

  // Build a compact knowledge of Sudha's published work for the call
  let contentText = "";
  try {
    const [posts, episodes] = await Promise.all([getBlogPosts(false), getPodcastEpisodes(false)]);
    const postLines = posts.slice(0, 25).map((p) => `• ${p.title}`).join("\n");
    const epLines = episodes.slice(0, 12).map((e) => `• ${e.title}`).join("\n");
    if (postLines || epLines) {
      contentText = `\n\nSudha's recent published work (reference it, suggest FRESH topics, avoid repeats):\nBlog:\n${postLines || "—"}\nPodcasts:\n${epLines || "—"}`;
    }
  } catch { /* ignore */ }

  const systemInstruction = `${TILLU_LIVE_PROMPT}${contentText}`;

  // Ephemeral tokens live on the v1alpha API
  const now = Date.now();
  const expireTime = new Date(now + 30 * 60 * 1000).toISOString();        // token valid 30 min
  const newSessionExpireTime = new Date(now + 2 * 60 * 1000).toISOString(); // must start session within 2 min

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1alpha/auth_tokens?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Plain token — model + system instruction are sent in the WS setup message
        body: JSON.stringify({ uses: 1, expireTime, newSessionExpireTime }),
      },
    );

    const data = await res.json() as { name?: string; error?: { message?: string } };
    if (!res.ok || !data.name) {
      return NextResponse.json(
        { error: data.error?.message ?? "Could not create live token." },
        { status: 500 },
      );
    }

    return NextResponse.json({ token: data.name, model: LIVE_MODEL, systemInstruction });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Token failed" }, { status: 500 });
  }
}
