import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/api-auth";
import { INVALID_COMMENT_ID_MESSAGE, isLikelyPersistentCommentId } from "@/lib/comment-ids";
import { addAdminReply, deleteComment, updateCommentStatus } from "@/lib/content-store";
import type { CommentStatus } from "@/lib/site-data";

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

export async function POST(request: Request, context: RouteContext) {
  const isAdmin = await isAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id: parentId } = await context.params;
    if (!isLikelyPersistentCommentId(parentId)) {
      return NextResponse.json({ error: INVALID_COMMENT_ID_MESSAGE }, { status: 400 });
    }

    const payload = (await request.json()) as { postId?: string; message?: string; adminName?: string };
    if (!payload.postId || !payload.message?.trim()) {
      return NextResponse.json({ error: "postId and message are required." }, { status: 400 });
    }

    const reply = await addAdminReply({
      postId: payload.postId,
      parentId,
      message: payload.message,
      adminName: payload.adminName,
    });

    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to post reply." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const isAdmin = await isAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    if (!isLikelyPersistentCommentId(id)) {
      return NextResponse.json({ error: INVALID_COMMENT_ID_MESSAGE }, { status: 400 });
    }

    const payload = (await request.json()) as { status?: CommentStatus };
    const status = payload.status;
    if (!status || !["approved", "pending", "hidden", "spam"].includes(status)) {
      return NextResponse.json({ error: "Invalid comment status." }, { status: 400 });
    }

    const result = await updateCommentStatus(id, status);
    return NextResponse.json({ comment: result });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to update comment.",
      },
      { status: 500 },
    );
  }
}
