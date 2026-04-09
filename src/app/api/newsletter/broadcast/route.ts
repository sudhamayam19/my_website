import { sendBroadcast } from "@/lib/email";
import { getNewsletterSubscribers } from "@/lib/content-store";
import { isAdminRequest } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  try {
    const { title, excerpt, link, type } = (await req.json()) as {
      title: string;
      excerpt: string;
      link: string;
      type: "article" | "podcast";
    };

    const subscribers = await getNewsletterSubscribers();
    const emails = subscribers.map((s) => s.email);

    const subject = type === "article"
      ? `New article: ${title}`
      : `New podcast: ${title}`;

    await sendBroadcast({ to: emails, subject, title, excerpt, link, type });

    return NextResponse.json({ sent: emails.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Broadcast failed" },
      { status: 500 }
    );
  }
}
