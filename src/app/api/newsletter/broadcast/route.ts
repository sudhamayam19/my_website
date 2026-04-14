import { sendBroadcast } from "@/lib/email";
import { getNewsletterSubscribers } from "@/lib/content-store";
import { isAdminRequest } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";

// Extend Vercel function timeout to 60s (emails can take time)
export const maxDuration = 60;

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email not configured. Add RESEND_API_KEY in Vercel." }, { status: 500 });
  }

  let body: { title?: unknown; excerpt?: unknown; link?: unknown; type?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { title, excerpt, link, type } = body;

  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }
  if (typeof excerpt !== "string") {
    return NextResponse.json({ error: "Excerpt is required." }, { status: 400 });
  }
  if (typeof link !== "string" || !link.trim()) {
    return NextResponse.json({ error: "Link is required." }, { status: 400 });
  }

  try {
    // Fetch subscribers with a 8s timeout — if Convex is slow/throttled, fail gracefully
    const subscribers = await withTimeout(
      getNewsletterSubscribers(),
      8000,
      [] as { email: string; createdAt: string }[],
    );

    const emails = subscribers.map((s) => s.email);

    if (emails.length === 0) {
      return NextResponse.json({ sent: 0, message: "No subscribers yet." });
    }

    const emailType = type === "podcast" ? "podcast" : "article";
    const subject = emailType === "article"
      ? `New article: ${title.trim()}`
      : `New podcast: ${title.trim()}`;

    await sendBroadcast({
      to: emails,
      subject,
      title: title.trim(),
      excerpt: excerpt.trim(),
      link: link.trim(),
      type: emailType,
    });

    return NextResponse.json({ sent: emails.length });
  } catch (error) {
    console.error("Broadcast error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Broadcast failed. Try again." },
      { status: 500 }
    );
  }
}
