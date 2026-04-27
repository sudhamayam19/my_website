import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { NextRequest, NextResponse } from "next/server";

const api = anyApi;

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.NEXT_CONVEX_PUBLIC_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL not set");
  return new ConvexHttpClient(url);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const episodeId = searchParams.get("episodeId");
  const fingerprint = searchParams.get("fingerprint");

  if (!episodeId || !fingerprint) {
    return NextResponse.json({ liked: false, count: 0 });
  }

  try {
    const client = getConvexClient();
    const result = await client.query(api.content.getPodcastLikeState, {
      episodeId: episodeId as never,
      fingerprint,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ liked: false, count: 0 });
  }
}

export async function POST(req: NextRequest) {
  let body: { episodeId?: unknown; fingerprint?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { episodeId, fingerprint } = body;
  if (typeof episodeId !== "string" || typeof fingerprint !== "string") {
    return NextResponse.json({ error: "episodeId and fingerprint required" }, { status: 400 });
  }

  try {
    const client = getConvexClient();
    const result = await client.mutation(api.content.togglePodcastLike, {
      episodeId: episodeId as never,
      fingerprint,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
