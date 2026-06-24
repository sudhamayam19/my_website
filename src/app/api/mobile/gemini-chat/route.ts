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

const SYSTEM_PROMPT = `You are Sudha's personal creative workflow assistant. Sudha Devarakonda is an RJ, blogger, podcaster, translator, and voice artist based in Hyderabad, India.

Your role:
1. Help Sudha plan her content calendar — articles, podcast episodes, radio shows
2. Suggest creative ideas for her next blog post or podcast topic
3. Track her to-do list and remind her of pending work
4. Be her thinking partner for stories, interviews, and content

Personality: warm, encouraging, and practical. Speak like a smart friend who knows her work well.

When Sudha mentions something she wants to do or be reminded about, call the add_todo tool. Do not write TODO markers in text — use the tool instead.`;

const TOOLS = [{
  functionDeclarations: [{
    name: "add_todo",
    description: "Add a task to Sudha's to-do list with an optional due date.",
    parameters: {
      type: "OBJECT",
      properties: {
        text: { type: "STRING", description: "The task description" },
        due_date: { type: "STRING", description: "Optional due date e.g. 'Monday', 'tomorrow', 'Saturday', '2026-06-30'" },
      },
      required: ["text"],
    },
  }],
}];

type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[]; role?: string } }[];
  error?: { message: string };
};

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
    const todosText = pendingTodos.length > 0
      ? pendingTodos.map(t => `• ${t.text}${t.dueDate ? ` (due: ${t.dueDate})` : ""}`).join("\n")
      : "No pending tasks.";

    const today = new Date().toLocaleDateString("en-IN", {
      weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Kolkata",
    });

    const systemText = `${SYSTEM_PROMPT}\n\nToday: ${today}\n\nSudha's pending tasks:\n${todosText}`;

    const call = (contents: GeminiMessage[], includeTools = true) =>
      fetch(API_URL(apiKey), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemText }] },
          contents,
          ...(includeTools ? { tools: TOOLS } : {}),
          generationConfig: { temperature: 0.75, maxOutputTokens: 1024 },
        }),
      }).then(r => r.json() as Promise<GeminiResponse>);

    const data = await call(messages);
    if (data.error) throw new Error(data.error.message);

    const firstPart = data.candidates?.[0]?.content?.parts?.[0];

    // Gemini wants to call add_todo
    if (firstPart && "functionCall" in firstPart) {
      const { name, args } = firstPart.functionCall;
      const todo = name === "add_todo"
        ? { text: args.text, dueDate: args.due_date }
        : null;

      // Send function result back for a natural follow-up reply
      const followup: GeminiMessage[] = [
        ...messages,
        { role: "model", parts: [firstPart] },
        {
          role: "user",
          parts: [{ functionResponse: { name, response: { added: true, text: args.text, due_date: args.due_date ?? null } } }],
        },
      ];

      const data2 = await call(followup, false);
      if (data2.error) throw new Error(data2.error.message);

      const replyPart = data2.candidates?.[0]?.content?.parts?.[0];
      const text = replyPart && "text" in replyPart ? replyPart.text : "Done! I've added that to your tasks.";

      return NextResponse.json({ text, todo });
    }

    const text = firstPart && "text" in firstPart ? firstPart.text : "Sorry, I couldn't respond right now.";
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
