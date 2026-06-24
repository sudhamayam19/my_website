import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/api-auth";
import { getChangeMakers, upsertChangeMaker } from "@/lib/content-store";

export async function GET(req: Request) {
  if (!await isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const items = await getChangeMakers(false);
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  if (!await isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json() as {
      id?: string; name: string; tagline: string; story: string;
      imageUrl?: string; link?: string; weekOf: string; published: boolean;
    };
    if (!body.name?.trim() || !body.tagline?.trim() || !body.story?.trim() || !body.weekOf) {
      return NextResponse.json({ error: "Name, tagline, story and week are required." }, { status: 400 });
    }
    const result = await upsertChangeMaker(body);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
