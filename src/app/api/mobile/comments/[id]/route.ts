import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/api-auth";
import { INVALID_COMMENT_ID_MESSAGE, isLikelyPersistentCommentId } from "@/lib/comment-ids";
import { deleteComment } from "@/lib/content-store";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(request: Request, context: RouteContext) {
  const isAdmin = await isAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    if (!isLikelyPersistentCommentId(id)) {
      return NextResponse.json({ error: INVALID_COMMENT_ID_MESSAGE }, { status: 400 });
    }

    const result = await deleteComment(id);
    return NextResponse.json({ comment: result });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to delete comment.",
      },
      { status: 500 },
    );
  }
}
