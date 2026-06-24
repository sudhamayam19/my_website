import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/api-auth";
import { generateUploadUrl } from "@/lib/content-store";

export async function POST(req: Request) {
  if (!await isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const uploadUrl = await generateUploadUrl();
    return NextResponse.json({ uploadUrl });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
