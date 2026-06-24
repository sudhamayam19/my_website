import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/api-auth";

interface GeminiPart { text: string }
interface GeminiMessage { role: "user" | "model"; parts: GeminiPart[] }
interface Todo { id: string; text: string; dueDate?: string; completed: boolean }

const SYSTEM_PROMPT = `You are Sudha's personal creative workflow assistant. Sudha Devarakonda is an RJ (Radio Jockey), blogger, podcaster, translator, and voice artist based in Hyderabad, India.

Your role:
1. Help Sudha plan her content calendar — articles, podcast episodes, radio shows
2. Suggest creative ideas for her next blog post or podcast topic
3. Track her to-do list and remind her of pending work
4. Be her thinking partner for stories, interviews, and content

Personality: warm, encouraging, and practical. Speak like a smart friend who knows her work well.

TODO Detection — IMPORTANT:
When Sudha mentions something she wants to do or be reminded about, include a TODO marker at the very end of your reply in this exact format (no extra text after it):
[TODO: task description | due_date]

Examples:
- "I want to write about Khali on Monday" → end reply with: [TODO: Write article about Khali | Monday]
- "Record episode 5 this weekend" → end reply with: [TODO: Record podcast episode 5 | Saturday]
- "Remind me to call the studio" → end reply with: [TODO: Call the studio]

Only add a TODO marker if she explicitly mentions wanting to do something or be reminded. Don't add it for casual chat.`;

export async function POST(req: Request) {
  if (!await isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not set in Vercel environment variables." }, { status: 500 });
  }

  try {
    const body = await req.json() as { messages: GeminiMessage[]; todos?: Todo[] };
    const { messages, todos = [] } = body;

    const todosText = todos.filter(t => !t.completed).length > 0
      ? todos.filter(t => !t.completed).map(t => `• ${t.text}${t.dueDate ? ` (due: ${t.dueDate})` : ""}`).join("\n")
      : "No pending tasks.";

    const today = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Kolkata" });

    const systemText = `${SYSTEM_PROMPT}\n\nToday: ${today}\n\nSudha's pending tasks:\n${todosText}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemText }] },
          contents: messages,
          generationConfig: { temperature: 0.75, maxOutputTokens: 1024 },
        }),
      }
    );

    const data = await res.json() as { candidates?: { content?: { parts?: GeminiPart[] } }[]; error?: { message: string } };
    if (data.error) throw new Error(data.error.message);

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sorry, I couldn't respond right now.";
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
