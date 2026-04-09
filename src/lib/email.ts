import { Resend } from "resend";

const FROM = process.env.RESEND_FROM ?? "Sudha Devarakonda <onboarding@resend.dev>";
const SITE = "https://sudhamayam.vercel.app";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

export async function sendWelcomeEmail(email: string) {
  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "You're subscribed to Sudha's updates!",
    html: `
      <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fffaf3;color:#19313b">
        <h1 style="font-size:26px;font-weight:900;margin:0 0 8px">Namaste! 🙏</h1>
        <p style="font-size:16px;line-height:1.7;color:#4d5c66">
          Thanks for subscribing to <strong>Sudha Devarakonda's</strong> updates.
          You'll be the first to know when a new article or podcast drops.
        </p>
        <a href="${SITE}/blog" style="display:inline-block;margin-top:24px;padding:12px 28px;background:#1f6973;color:#fff;border-radius:999px;text-decoration:none;font-weight:700;font-size:14px">
          Read Latest Articles →
        </a>
        <p style="margin-top:32px;font-size:12px;color:#8fa3ad">
          You subscribed at <a href="${SITE}" style="color:#1f6973">${SITE}</a>.
          Reply to this email to unsubscribe.
        </p>
      </div>
    `,
  });
}

export async function sendBroadcast({
  to,
  subject,
  title,
  excerpt,
  link,
  type,
}: {
  to: string[];
  subject: string;
  title: string;
  excerpt: string;
  link: string;
  type: "article" | "podcast";
}) {
  if (to.length === 0) return;
  const resend = getResend();
  const label = type === "article" ? "Read the full article" : "Listen to the episode";
  const icon = type === "article" ? "📝" : "🎙️";

  // Resend supports batch sending (up to 100 per call)
  const batches: string[][] = [];
  for (let i = 0; i < to.length; i += 100) batches.push(to.slice(i, i + 100));

  for (const batch of batches) {
    await resend.batch.send(
      batch.map((email) => ({
        from: FROM,
        to: email,
        subject,
        html: `
          <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fffaf3;color:#19313b">
            <p style="font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#1f6973;margin:0 0 16px">
              ${icon} New ${type === "article" ? "Article" : "Podcast"} from Sudha
            </p>
            <h1 style="font-size:24px;font-weight:900;margin:0 0 12px">${title}</h1>
            <p style="font-size:15px;line-height:1.7;color:#4d5c66">${excerpt}</p>
            <a href="${link}" style="display:inline-block;margin-top:24px;padding:12px 28px;background:#1f6973;color:#fff;border-radius:999px;text-decoration:none;font-weight:700;font-size:14px">
              ${label} →
            </a>
            <p style="margin-top:32px;font-size:12px;color:#8fa3ad">
              You subscribed at <a href="${SITE}" style="color:#1f6973">${SITE}</a>.
              Reply to unsubscribe.
            </p>
          </div>
        `,
      }))
    );
  }
}
