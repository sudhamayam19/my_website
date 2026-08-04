import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/api-auth";
import {
  createDiscussionTopic,
  deleteDiscussionTopic,
  getDiscussionTopics,
  updateDiscussionTopicStatus,
} from "@/lib/discussions";

export async function GET(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ topics: await getDiscussionTopics(true) });
}

// Sudha posts a new discussion prompt (the "line to discuss") + guidelines
export async function POST(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as {
      title?: string;
      body?: string;
      guidelines?: string;
      imageUrl?: string;
      category?: string;
      author?: string;
    };
    const title = (body.title ?? "").trim();
    const prompt = (body.body ?? "").trim();

    if (!title || !prompt) {
      return NextResponse.json({ error: "Title and discussion line are required." }, { status: 400 });
    }
    if (title.length > 140) {
      return NextResponse.json({ error: "Title is too long (max 140 characters)." }, { status: 400 });
    }

    const { id } = await createDiscussionTopic({
      title,
      body: prompt,
      guidelines: body.guidelines,
      imageUrl: body.imageUrl?.trim() || undefined,
      category: body.category,
      author: (body.author ?? "Sudha").trim() || "Sudha",
    });
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not create discussion." },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id, status } = (await req.json()) as {
      id?: string;
      status?: "approved" | "hidden" | "spam";
    };
    if (!id || !status) {
      return NextResponse.json({ error: "id and status are required." }, { status: 400 });
    }
    await updateDiscussionTopicStatus(id, status);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed." },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });
    await deleteDiscussionTopic(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed." },
      { status: 500 },
    );
  }
}
