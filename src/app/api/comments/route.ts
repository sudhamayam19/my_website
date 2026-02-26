import { NextResponse } from "next/server";
import { addComment } from "@/lib/content-store";

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const postId = asString(payload.postId);
    const name = asString(payload.name);
    const message = asString(payload.message);

    if (!postId || !name || !message) {
      return NextResponse.json(
        { error: "postId, name, and message are required." },
        { status: 400 },
      );
    }

    const comment = await addComment({
      postId,
      author: name,
      message,
    });

    return NextResponse.json({ comment });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to create comment.",
      },
      { status: 500 },
    );
  }
}
