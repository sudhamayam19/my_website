import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/api-auth";
import { createPodcastEpisode, getPodcastEpisodes } from "@/lib/content-store";
import { parsePodcastPayload } from "@/lib/podcast-payload";

export async function GET(request: Request) {
  const isAdmin = await isAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const episodes = await getPodcastEpisodes({ includeDrafts: true });
    return NextResponse.json({ episodes });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load podcast episodes.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const isAdmin = await isAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const parsed = parsePodcastPayload(payload);
    if (!parsed.input) {
      return NextResponse.json(
        { error: parsed.error || "Invalid podcast payload." },
        { status: 400 },
      );
    }

    const episode = await createPodcastEpisode(parsed.input);
    return NextResponse.json({ episode });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create episode.",
      },
      { status: 500 },
    );
  }
}
