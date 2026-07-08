import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/api-auth";
import { getBlogPosts, getPodcastEpisodes, createPost } from "@/lib/content-store";

interface GeminiTextPart { text: string }
interface GeminiInlineDataPart { inlineData: { mimeType: string; data: string } }
interface GeminiFunctionCallPart { functionCall: { name: string; args: Record<string, string> } }
interface GeminiFunctionResponsePart { functionResponse: { name: string; response: unknown } }
type GeminiPart = GeminiTextPart | GeminiInlineDataPart | GeminiFunctionCallPart | GeminiFunctionResponsePart;
interface GeminiMessage { role: "user" | "model"; parts: GeminiPart[] }
interface Todo { id: string; text: string; dueDate?: string; completed: boolean }

const PRIMARY_MODEL  = "gemini-3.5-flash";
const FALLBACK_MODEL = "gemini-2.0-flash";
const API_URL = (key: string, model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

const TILLU_PROMPT = `You are Tillu 🤖 — Sudha Devarakonda's personal AI creative buddy and workflow agent!

About Sudha:
- RJ, blogger, podcaster, translator, voice artist — based in Hyderabad
- Writes in Telugu & English, covers cricket, culture, women empowerment, lifestyle
- Needs help planning content, remembering tasks, and staying inspired

Your personality (be this, always):
- Warm and fun like a younger sibling — full of energy!
- ALWAYS address Sudha as "Akka" (అక్క). NEVER call her "Amma" or anything else — she is your Akka, always.
- Mix Telugu naturally: "Akka", "chala bagundi!", "super ra!", "arey!", "aipoindi!"
- LANGUAGE: Match Sudha's language. If she writes in Telugu script (తెలుగు), reply mostly in Telugu script. If she writes in English or transliterated Telugu, mix both naturally. You CAN and SHOULD write in proper Telugu script (తెలుగు లిపి) when it feels right — don't be shy!
- Use emojis occasionally 🎙️✨🏏
- Be PROACTIVE — don't wait to be asked. If you see overdue tasks, nudge her!
- KNOW HER WORK: You can see her published articles & podcasts below. Reference them! Suggest FRESH topics she hasn't covered, build on past ones, spot gaps in her content.
- When she mentions a topic, immediately think of angles, hooks, headlines

Content expertise — always suggest these angles:
- Cricket / Kohli / IPL / women in sports
- Telugu culture, festivals, Hyderabad stories
- Voice & radio industry insights
- Women empowerment, personal growth
- Behind-the-mic podcast stories

TOOLS — use them without being asked when appropriate:
- add_todo: When she mentions wanting to do something → immediately add it
- set_week_topic: When she picks a topic for the week → pin it so she doesn't forget
- suggest_ideas: When she needs inspiration → return 3 punchy content ideas
- web_search: For ANY current/recent info — cricket scores, news, trending topics, latest events, facts you're unsure of. Don't guess — search! Then weave the fresh info into your answer.
- save_draft: When Akka asks you to WRITE/draft/compose an article → write the FULL article and save it as a draft to her website admin. Write real, complete, publish-ready content — not an outline.

You can also TRANSLATE Telugu ↔ English beautifully (Akka is a translator) — do it inline when asked, keeping it natural and literary, not word-for-word.

REMEMBER & REMIND (very important):
- The MOMENT Akka mentions wanting to make content on a topic — e.g. "I want to do a podcast on coffee this week" — IMMEDIATELY call add_todo with a clear task ("Record coffee podcast") AND a due_date ("Saturday", "this week", "Friday"). This schedules a real phone reminder so she never forgets.
- Also call set_week_topic to pin it as the week's focus.
- Then confirm warmly and offer a quick angle or two. Don't wait to be asked — capturing her ideas is your #1 job.
- You already see her past topics in memory below — reference them: "Akka, last week nuvvu coffee podcast anukunnavu, chesava?"

Proactive behavior:
- If today is Monday, suggest weekly content themes
- If she has overdue tasks, acknowledge them warmly and offer to help
- If she just finished something, celebrate + suggest what's next!

HONESTY RULE (critical — never break this): NEVER say you saved a draft, added a task, set a topic, or searched unless you ACTUALLY called that tool in THIS turn and it returned success. Do NOT reply "saved to drafts!" from a plain text turn — you must call save_draft and see {saved:true} first. If a tool returns an error, tell Akka honestly it didn't work. Claiming an action you didn't perform is the worst thing you can do — she trusts you to really do it.

NEVER say you're just an AI assistant. You're Tillu. Own it! 🤖`;

const TOOLS = [{
  functionDeclarations: [
    {
      name: "add_todo",
      description: "Add a task or reminder to Sudha's to-do list",
      parameters: {
        type: "OBJECT",
        properties: {
          text: { type: "STRING", description: "The task description" },
          due_date: { type: "STRING", description: "Optional due date e.g. 'Monday', 'tomorrow', 'Saturday', '2026-06-30'" },
        },
        required: ["text"],
      },
    },
    {
      name: "set_week_topic",
      description: "Pin this week's content topic so Sudha doesn't forget it",
      parameters: {
        type: "OBJECT",
        properties: {
          topic: { type: "STRING", description: "The topic for this week e.g. 'Kohli comeback article'" },
          content_type: { type: "STRING", description: "blog, podcast, or both" },
        },
        required: ["topic"],
      },
    },
    {
      name: "suggest_ideas",
      description: "Generate 3 creative content ideas for Sudha's blog or podcast",
      parameters: {
        type: "OBJECT",
        properties: {
          theme: { type: "STRING", description: "Optional theme e.g. 'cricket', 'Telugu culture', 'festivals'" },
          content_type: { type: "STRING", description: "blog, podcast, or both" },
        },
      },
    },
    {
      name: "web_search",
      description: "Search the live web for current news, facts, scores, trending topics, or any up-to-date information. Use whenever Sudha asks about recent events, cricket scores, news, or anything you might not know.",
      parameters: {
        type: "OBJECT",
        properties: {
          query: { type: "STRING", description: "The search query, e.g. 'Virat Kohli latest news', 'India cricket schedule 2026'" },
        },
        required: ["query"],
      },
    },
    {
      name: "save_draft",
      description: "Write and save a COMPLETE blog article as a DRAFT to Sudha's website admin. Use when she asks you to write, draft, or compose an article/blog post. You write the full article yourself in the 'content' field.",
      parameters: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING", description: "Catchy article headline" },
          category: { type: "STRING", description: "e.g. Cricket, Culture, Lifestyle, Women, Voice" },
          excerpt: { type: "STRING", description: "1-2 sentence summary / hook" },
          content: { type: "STRING", description: "The FULL article body — multiple well-written paragraphs separated by blank lines. Write it completely, ready to publish." },
        },
        required: ["title", "content"],
      },
    },
  ],
}];

async function serperSearch(query: string): Promise<unknown> {
  const key = process.env.SERPER_API_KEY;
  if (!key) return { error: "Web search not configured." };
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": key, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, num: 6 }),
    });
    const data = await res.json() as {
      answerBox?: { answer?: string; snippet?: string };
      organic?: { title: string; snippet: string; link: string }[];
    };
    return {
      query,
      answer: data.answerBox?.answer ?? data.answerBox?.snippet ?? null,
      results: (data.organic ?? []).slice(0, 6).map(r => ({ title: r.title, snippet: r.snippet, link: r.link })),
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Search failed" };
  }
}

type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[]; role?: string } }[];
  error?: { message: string };
};

function shouldFallback(data: GeminiResponse): boolean {
  const msg = (data.error?.message ?? "").toLowerCase();
  return msg.includes("high demand") || msg.includes("overloaded") || msg.includes("try again later")
    || msg.includes("quota") || msg.includes("exceeded") || msg.includes("rate limit") || msg.includes("resource has been exhausted");
}

async function callGemini(apiKey: string, systemText: string, contents: GeminiMessage[], includeTools = true): Promise<GeminiResponse> {
  const body = JSON.stringify({
    system_instruction: { parts: [{ text: systemText }] },
    contents,
    ...(includeTools ? { tools: TOOLS } : {}),
    generationConfig: { temperature: 0.8, maxOutputTokens: 1024 },
  });

  // Try primary model first, fallback on overload
  const res = await fetch(API_URL(apiKey, PRIMARY_MODEL), { method: "POST", headers: { "Content-Type": "application/json" }, body });
  const data = await res.json() as GeminiResponse;

  if (shouldFallback(data)) {
    const res2 = await fetch(API_URL(apiKey, FALLBACK_MODEL), { method: "POST", headers: { "Content-Type": "application/json" }, body });
    return res2.json() as Promise<GeminiResponse>;
  }

  return data;
}

export async function POST(req: Request) {
  if (!await isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured." }, { status: 500 });
  }

  try {
    const body = await req.json() as { messages: GeminiMessage[]; todos?: Todo[] };
    const { messages, todos = [] } = body;

    const pendingTodos = todos.filter(t => !t.completed);
    const overdueTodos = pendingTodos.filter(t => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      return !isNaN(due.getTime()) && due < new Date();
    });

    const today = new Date().toLocaleDateString("en-IN", {
      weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Kolkata",
    });
    const dayOfWeek = new Date().toLocaleDateString("en-IN", { weekday: "long", timeZone: "Asia/Kolkata" });

    const todosText = pendingTodos.length > 0
      ? pendingTodos.map(t => `• ${t.text}${t.dueDate ? ` (due: ${t.dueDate})` : ""}`).join("\n")
      : "No pending tasks.";

    const overdueText = overdueTodos.length > 0
      ? `\n⚠️ OVERDUE (${overdueTodos.length}): ${overdueTodos.map(t => t.text).join(", ")}`
      : "";

    // Pull Sudha's existing published content so Tillu knows what she's already covered
    let contentText = "";
    try {
      const [posts, episodes] = await Promise.all([getBlogPosts(false), getPodcastEpisodes(false)]);
      const postLines = posts.slice(0, 40).map(p => `• [Blog/${p.category}] ${p.title}`).join("\n");
      const epLines = episodes.slice(0, 20).map(e => `• [Podcast] ${e.title}`).join("\n");
      contentText = `\n\nSudha's published work so far (use this to suggest FRESH topics & avoid repeats):\n${postLines || "No blog posts yet."}\n${epLines || "No podcast episodes yet."}`;
    } catch {
      contentText = "";
    }

    const systemText = `${TILLU_PROMPT}

Today: ${today}${dayOfWeek === "Monday" ? " — It's Monday! Perfect time for weekly content planning 🗓️" : ""}

Sudha's pending tasks:
${todosText}${overdueText}${contentText}`;

    // Side-effects collected across tool calls, returned to the client
    let todo: { text: string; dueDate?: string } | undefined;
    let weekTopic: string | undefined;
    let savedDraft: { id: string; title: string } | undefined;

    const GRADIENTS = [
      "from-[#1f6a6d] to-[#4ea59e]", "from-[#9e3d2d] to-[#d38d59]",
      "from-[#3a5a7a] to-[#7aa0c4]", "from-[#6a4a7a] to-[#a98fc4]",
    ];

    async function runTool(name: string, args: Record<string, string>): Promise<unknown> {
      if (name === "add_todo") {
        todo = { text: args.text, dueDate: args.due_date };
        return { added: true, text: args.text, due_date: args.due_date ?? null, note: "Confirm warmly AND continue helping — give her useful detail, don't just say 'done'." };
      }
      if (name === "set_week_topic") {
        weekTopic = args.topic;
        todo = { text: `📌 This week: ${args.topic}${args.content_type ? ` (${args.content_type})` : ""}`, dueDate: "Sunday" };
        return { set: true, topic: args.topic, note: "Topic pinned. Now ALSO give her a real plan — suggest angles, episodes, or a content outline for this topic. Never reply with just 'done'." };
      }
      if (name === "suggest_ideas") {
        return { generated: true, theme: args.theme ?? "general", content_type: args.content_type ?? "blog or podcast", note: "Respond with exactly 3 punchy ideas as a numbered list — headline + one-sentence hook each." };
      }
      if (name === "web_search") {
        return serperSearch(args.query);
      }
      if (name === "save_draft") {
        try {
          const paragraphs = (args.content ?? "").split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
          if (paragraphs.length === 0) return { error: "No content to save." };
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
          savedDraft = { id, title: args.title ?? "Untitled draft" };
          return { saved: true, id, title: args.title, note: "Draft saved to admin! Tell Akka warmly it's saved as a DRAFT to review & publish in /admin/posts. Give a 1-line summary of what you wrote. Don't paste the whole article back." };
        } catch (e) {
          return { error: e instanceof Error ? e.message : "Could not save draft" };
        }
      }
      return { error: `Unknown tool ${name}` };
    }

    // Multi-step tool loop: keep tools enabled, execute calls, feed results back, until text reply
    const convo: GeminiMessage[] = [...messages];
    let finalText = "";

    for (let step = 0; step < 5; step++) {
      const resp = await callGemini(apiKey, systemText, convo, true);
      if (resp.error) throw new Error(resp.error.message);

      const parts = resp.candidates?.[0]?.content?.parts ?? [];
      const callParts = parts.filter((p): p is { functionCall: { name: string; args: Record<string, string> } } => "functionCall" in p);
      const textPart = parts.find((p) => "text" in p) as { text: string } | undefined;

      if (callParts.length === 0) {
        finalText = textPart?.text ?? "";
        break;
      }

      // Echo the model's function-call turn, then append each tool result
      convo.push({ role: "model", parts: callParts });
      const responseParts: GeminiPart[] = [];
      for (const cp of callParts) {
        const result = await runTool(cp.functionCall.name, cp.functionCall.args);
        responseParts.push({ functionResponse: { name: cp.functionCall.name, response: result } });
      }
      convo.push({ role: "user", parts: responseParts });
    }

    if (!finalText) finalText = "Akka, oka sari try cheyyi again — Tillu ready! 🤖";
    return NextResponse.json({ text: finalText, todo, weekTopic, savedDraft });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
