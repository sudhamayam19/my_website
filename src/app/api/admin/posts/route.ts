import { NextResponse } from "next/server";
import { createPost } from "@/lib/content-store";
import { isAdminRequest } from "@/lib/api-auth";
import { parsePostPayload } from "@/lib/post-payload";

export async function POST(request: Request) {
  const isAdmin = await isAdminRequest();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const parsed = parsePostPayload(payload);

    if (!parsed.input) {
      return NextResponse.json(
        { error: parsed.error || "Invalid post payload." },
        { status: 400 },
      );
    }

    const post = await createPost(parsed.input);
    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create post.",
      },
      { status: 500 },
    );
  }
}
