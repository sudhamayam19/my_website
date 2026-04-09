import { isAdminRequest } from "@/lib/api-auth";
import { getNewsletterSubscribers } from "@/lib/content-store";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const subscribers = await getNewsletterSubscribers();
  return NextResponse.json({ subscribers });
}
