import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/api-auth";
import {
  deletePodcastEpisode,
  getPodcastEpisodeById,
  updatePodcastEpisode,
} from "@/lib/content-store";
import { parsePodcastPayload } from "@/lib/podcast-payload";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, context: RouteContext) {
  const isAdmin = await isAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const episode = await getPodcastEpisodeById(id);
    if (!episode) {
      return NextResponse.json({ error: "Episode not found." }, { status: 404 });
    }

    return NextResponse.json({ episode });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load episode.",
      },
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
    const payload = await request.json();
    const parsed = parsePodcastPayload(payload);

    if (!parsed.input) {
      return NextResponse.json(
        { error: parsed.error || "Invalid podcast payload." },
        { status: 400 },
      );
    }

    const episode = await updatePodcastEpisode(id, parsed.input);
    return NextResponse.json({ episode });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to update episode.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const isAdmin = await isAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const episode = await deletePodcastEpisode(id);
    return NextResponse.json({ episode });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to delete episode.",
      },
      { status: 500 },
    );
  }
}
