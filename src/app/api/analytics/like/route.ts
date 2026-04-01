import { NextRequest, NextResponse } from "next/server";
import { incrementPostLike } from "@/lib/content-store";

export async function POST(request: NextRequest) {
  try {
    const { postId } = await request.json();
    if (!postId || typeof postId !== "string") {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    const likes = await incrementPostLike(postId);
    return NextResponse.json({ ok: true, likes });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
