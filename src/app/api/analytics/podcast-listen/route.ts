import { NextResponse } from "next/server";
import { incrementPodcastListen } from "@/lib/content-store";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { id?: string };
    const id = typeof payload.id === "string" ? payload.id.trim() : "";
    if (!id) {
      return NextResponse.json({ error: "Episode ID is required." }, { status: 400 });
    }

    const listens = await incrementPodcastListen(id);
    return NextResponse.json({ listens });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to record listen.",
      },
      { status: 500 },
    );
  }
}
