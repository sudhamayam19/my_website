import { NextResponse } from "next/server";
import { createAdminSessionToken, validateAdminCredentials } from "@/lib/simple-auth";

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const username = asString(payload.username);
    const password = typeof payload.password === "string" ? payload.password : "";

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 },
      );
    }

    if (!validateAdminCredentials(username, password)) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const token = createAdminSessionToken(username);
    return NextResponse.json({ token, username });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to sign in.",
      },
      { status: 500 },
    );
  }
}
