import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/api-auth";
import {
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
