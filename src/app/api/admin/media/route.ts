import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/api-auth";
import { getMediaAppearances, upsertMediaAppearance } from "@/lib/content-store";

const CATEGORIES = ["tv", "radio", "print", "online", "podcast", "event"] as const;

export async function GET(request: Request) {
  if (!await isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const items = await getMediaAppearances();
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!await isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.title !== "string" || !body.title.trim()) return NextResponse.json({ error: "Title required." }, { status: 400 });
    if (typeof body.outlet !== "string" || !body.outlet.trim()) return NextResponse.json({ error: "Outlet required." }, { status: 400 });
    if (!CATEGORIES.includes(body.category as typeof CATEGORIES[number])) return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    if (typeof body.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) return NextResponse.json({ error: "Invalid date." }, { status: 400 });
    const result = await upsertMediaAppearance({
      id: typeof body.id === "string" ? body.id : undefined,
      title: (body.title as string).trim(),
      outlet: (body.outlet as string).trim(),
      category: body.category as typeof CATEGORIES[number],
      date: body.date as string,
      description: typeof body.description === "string" ? body.description.trim() || undefined : undefined,
      link: typeof body.link === "string" ? body.link.trim() || undefined : undefined,
      imageUrl: typeof body.imageUrl === "string" ? body.imageUrl.trim() || undefined : undefined,
      featured: body.featured === true,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed." }, { status: 500 });
  }
}
