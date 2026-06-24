import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/api-auth";
import { getStorageUrl } from "@/lib/content-store";

export async function GET(req: Request) {
  if (!await isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const storageId = searchParams.get("id");
  if (!storageId) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    const url = await getStorageUrl(storageId);
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
