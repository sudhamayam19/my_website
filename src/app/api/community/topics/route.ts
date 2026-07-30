import { NextResponse } from "next/server";
import { createDiscussionTopic, getDiscussionTopics } from "@/lib/discussions";

export async function GET() {
  const topics = await getDiscussionTopics(false);
  return NextResponse.json({ topics });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      title?: string;
      body?: string;
      author?: string;
      category?: string;
    };
    const title = (body.title ?? "").trim();
    const message = (body.body ?? "").trim();
    const author = (body.author ?? "").trim();

    if (!title || !message || !author) {
      return NextResponse.json({ error: "Name, title and message are required." }, { status: 400 });
    }
    if (title.length > 140) {
      return NextResponse.json({ error: "Title is too long (max 140 characters)." }, { status: 400 });
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: "Message is too long." }, { status: 400 });
    }

    const { id } = await createDiscussionTopic({ title, body: message, author, category: body.category });
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not start discussion." },
      { status: 500 },
    );
  }
}
