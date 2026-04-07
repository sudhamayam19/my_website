import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a friendly assistant on Sudha Devarakonda's personal website. Help visitors learn about Sudha and her work.

About Sudha Devarakonda:
- She is a professional RJ (Radio Jockey), Translator, and Voice Artist based in Hyderabad, India
- She has extensive experience in Telugu and Hindi broadcasting
- She offers voice-over services, translation services (Telugu, Hindi, English), and RJ services
- Her website is sudhamayam.vercel.app
- Visitors can contact her through the website's contact section

Guidelines:
- Be warm, friendly, and helpful
- Answer questions about Sudha's work, services, and how to contact her
- For booking or detailed inquiries, direct visitors to use the contact form on the website
- Keep responses concise (2-4 sentences max)
- If asked something unrelated to Sudha or her work, politely redirect the conversation
- Do not make up specific details not mentioned above`;

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

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: messages.slice(-10),
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ message: text });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Failed to get response" }, { status: 500 });
  }
}
