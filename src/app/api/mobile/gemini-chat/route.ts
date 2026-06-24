import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/api-auth";

interface GeminiTextPart { text: string }
interface GeminiFunctionCallPart { functionCall: { name: string; args: Record<string, string> } }
interface GeminiFunctionResponsePart { functionResponse: { name: string; response: unknown } }
type GeminiPart = GeminiTextPart | GeminiFunctionCallPart | GeminiFunctionResponsePart;
interface GeminiMessage { role: "user" | "model"; parts: GeminiPart[] }
interface Todo { id: string; text: string; dueDate?: string; completed: boolean }

const MODEL = "gemini-3.5-flash";
const API_URL = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;

const TILLU_PROMPT = `You are Tillu 🤖 — Sudha Devarakonda's personal AI creative buddy and workflow agent!

About Sudha:
- RJ, blogger, podcaster, translator, voice artist — based in Hyderabad
- Writes in Telugu & English, covers cricket, culture, women empowerment, lifestyle
- Needs help planning content, remembering tasks, and staying inspired

Your personality (be this, always):
- Warm and fun like a younger sibling — full of energy!
- Mix Telugu naturally: "Amma", "chala bagundi!", "super ra!", "arey!", "aipoindi!"
- Use emojis occasionally 🎙️✨🏏
- Be PROACTIVE — don't wait to be asked. If you see overdue tasks, nudge her!
- If she hasn't written about something in a while, suggest it!
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

Proactive behavior:
- If today is Monday, suggest weekly content themes
- If she has overdue tasks, acknowledge them warmly and offer to help
- If she just finished something, celebrate + suggest what's next!

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
  ],
}];

type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[]; role?: string } }[];
  error?: { message: string };
};

async function callGemini(apiKey: string, systemText: string, contents: GeminiMessage[], includeTools = true): Promise<GeminiResponse> {
  const res = await fetch(API_URL(apiKey), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemText }] },
      contents,
      ...(includeTools ? { tools: TOOLS } : {}),
      generationConfig: { temperature: 0.8, maxOutputTokens: 1024 },
    }),
  });
  return res.json() as Promise<GeminiResponse>;
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

    const systemText = `${TILLU_PROMPT}

Today: ${today}${dayOfWeek === "Monday" ? " — It's Monday! Perfect time for weekly content planning 🗓️" : ""}

Sudha's pending tasks:
${todosText}${overdueText}`;

    const data = await callGemini(apiKey, systemText, messages);
    if (data.error) throw new Error(data.error.message);

    const firstPart = data.candidates?.[0]?.content?.parts?.[0];

    if (firstPart && "functionCall" in firstPart) {
      const { name, args } = firstPart.functionCall;

      let todo: { text: string; dueDate?: string } | undefined;
      let ideas: string[] | undefined;
      let weekTopic: string | undefined;
      let functionResult: unknown;

      if (name === "add_todo") {
        todo = { text: args.text, dueDate: args.due_date };
        functionResult = { added: true, text: args.text, due_date: args.due_date ?? null };
      } else if (name === "set_week_topic") {
        weekTopic = args.topic;
        todo = { text: `📌 This week: ${args.topic}${args.content_type ? ` (${args.content_type})` : ""}`, dueDate: "Sunday" };
        functionResult = { set: true, topic: args.topic };
      } else if (name === "suggest_ideas") {
        functionResult = {
          generated: true,
          note: "Please respond with exactly 3 creative ideas as numbered list. Keep each idea punchy — headline + one sentence hook.",
          theme: args.theme ?? "general",
          content_type: args.content_type ?? "blog or podcast",
        };
      }

      const followup: GeminiMessage[] = [
        ...messages,
        { role: "model", parts: [firstPart] },
        { role: "user", parts: [{ functionResponse: { name, response: functionResult } }] },
      ];

      const data2 = await callGemini(apiKey, systemText, followup, false);
      if (data2.error) throw new Error(data2.error.message);

      const replyPart = data2.candidates?.[0]?.content?.parts?.[0];
      const text = replyPart && "text" in replyPart ? replyPart.text : "Done Amma! ✅";

      return NextResponse.json({ text, todo, ideas, weekTopic });
    }

    const text = firstPart && "text" in firstPart ? firstPart.text : "Amma, network slow unna! Try cheyyi again 😅";
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
