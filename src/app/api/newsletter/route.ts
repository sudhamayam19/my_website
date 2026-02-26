import { NextResponse } from "next/server";
import { addNewsletterSubscriber } from "@/lib/content-store";

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const email = asString(payload.email);

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const result = await addNewsletterSubscriber(email);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to subscribe right now.",
      },
      { status: 500 },
    );
  }
}
