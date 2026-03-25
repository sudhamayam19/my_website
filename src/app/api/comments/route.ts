import { NextResponse } from "next/server";
import { addComment, getBlogPostById } from "@/lib/content-store";
import { sendCommentNotification } from "@/lib/comment-notifications";

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

    const post = await getBlogPostById(postId);

    void sendCommentNotification({
      postId,
      postTitle: post?.title,
      author: name,
      message,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    }).catch((error) => {
      console.error("Failed to send comment notification email.", error);
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
