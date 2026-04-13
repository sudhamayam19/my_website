import { sendWelcomeEmail } from "@/lib/email";
import { addNewsletterSubscriber } from "@/lib/content-store";
import { NextResponse } from "next/server";

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

    if (!result.alreadySubscribed && process.env.RESEND_API_KEY) {
      // Fire and forget — don't block the response
      void sendWelcomeEmail(email).catch((e) => console.error("[newsletter] welcome email failed:", e));
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to subscribe right now." },
      { status: 500 }
    );
  }
}
