import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/api-auth";
import {
  deleteScheduledDose,
  getScheduledDoses,
  upsertScheduledDose,
} from "@/lib/content-store";

export async function GET(request: Request) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const doses = await getScheduledDoses();
    return NextResponse.json({ doses });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load schedule." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const body = (await request.json()) as {
      date?: unknown;
      text?: unknown;
      author?: unknown;
      style?: unknown;
    };
    if (typeof body.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      return NextResponse.json({ error: "Invalid date." }, { status: 400 });
    }
    if (typeof body.text !== "string" || !body.text.trim()) {
      return NextResponse.json({ error: "Text is required." }, { status: 400 });
    }
    const result = await upsertScheduledDose({
      date: body.date,
      text: body.text.trim(),
      author: typeof body.author === "string" && body.author.trim() ? body.author.trim() : undefined,
      style: body.style === "flash" ? "flash" : "scroll",
    });
    return NextResponse.json({ id: result.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get("date");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid date." }, { status: 400 });
    }
    await deleteScheduledDose(date);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete." },
      { status: 500 },
    );
  }
}
