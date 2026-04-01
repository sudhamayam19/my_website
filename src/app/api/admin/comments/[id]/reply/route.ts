import { NextResponse } from "next/server";
import { addAdminReply } from "@/lib/content-store";
import { isAdminAuthenticated } from "@/lib/simple-auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id: parentId } = await context.params;
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
