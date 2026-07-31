import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/api-auth";
import { addDiscussionReply } from "@/lib/discussions";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await req.json()) as { author?: string; message?: string };
    const author = (body.author ?? "").trim();
    const message = (body.message ?? "").trim();

    if (!author || !message) {
      return NextResponse.json({ error: "Name and reply are required." }, { status: 400 });
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: "Reply is too long." }, { status: 400 });
    }

    // Sudha's own replies get badged as admin
    const isAdmin = await isAdminRequest(req);
    const reply = await addDiscussionReply({
      topicId: id,
      author,
      message,
      authorType: isAdmin ? "admin" : "user",
    });
    return NextResponse.json({ reply });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not post reply." },
      { status: 500 },
    );
  }
}
