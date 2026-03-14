import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/api-auth";
import { deletePost, updatePost } from "@/lib/content-store";
import { parsePostPayload } from "@/lib/post-payload";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const isAdmin = await isAdminRequest();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const payload = await request.json();
    const parsed = parsePostPayload(payload);

    if (!parsed.input) {
      return NextResponse.json(
        { error: parsed.error || "Invalid post payload." },
        { status: 400 },
      );
    }

    const post = await updatePost(id, parsed.input);
    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to update post.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const isAdmin = await isAdminRequest();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const result = await deletePost(id);
    return NextResponse.json({ post: result });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to delete post.",
      },
      { status: 500 },
    );
  }
}
