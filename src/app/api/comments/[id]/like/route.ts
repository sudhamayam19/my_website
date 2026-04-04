import { NextResponse } from "next/server";
import { likeComment } from "@/lib/content-store";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const likes = await likeComment(id);
    return NextResponse.json({ likes });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to like comment." },
      { status: 500 },
    );
  }
}
