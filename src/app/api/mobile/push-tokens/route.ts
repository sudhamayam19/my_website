import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/api-auth";
import { registerAdminPushToken } from "@/lib/content-store";

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const isAdmin = await isAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const token = asString(payload.token);
    const platform = asString(payload.platform) || "unknown";

    if (!token) {
      return NextResponse.json({ error: "Push token is required." }, { status: 400 });
    }

    const registration = await registerAdminPushToken(token, platform);
    return NextResponse.json({ registration });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to register push token.",
      },
      { status: 500 },
    );
  }
}
