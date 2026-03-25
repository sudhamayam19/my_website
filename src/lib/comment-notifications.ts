import { Resend } from "resend";

interface CommentNotificationInput {
  postId: string;
  postTitle?: string;
  author: string;
  message: string;
  siteUrl?: string;
}

function getResendApiKey(): string | null {
  const value = process.env.RESEND_API_KEY?.trim();
  return value ? value : null;
}

function getNotificationTo(): string | null {
  const value = process.env.COMMENT_NOTIFICATION_TO?.trim();
  return value ? value : null;
}

function getNotificationFrom(): string | null {
  const value = process.env.COMMENT_NOTIFICATION_FROM?.trim();
  return value ? value : null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendCommentNotification({
  postId,
  postTitle,
  author,
  message,
  siteUrl,
}: CommentNotificationInput): Promise<void> {
  const apiKey = getResendApiKey();
  const to = getNotificationTo();
  const from = getNotificationFrom();

  if (!apiKey || !to || !from) {
    return;
  }

  const resend = new Resend(apiKey);
  const safeAuthor = escapeHtml(author);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");
  const safePostTitle = escapeHtml(postTitle || "Blog post");
  const postLink = siteUrl ? `${siteUrl.replace(/\/$/, "")}/blog/${postId}` : null;

  await resend.emails.send({
    from,
    to: [to],
    subject: `New comment on ${safePostTitle}`,
    replyTo: to,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2d39;">
        <h2 style="margin-bottom: 12px;">New comment received</h2>
        <p><strong>Post:</strong> ${safePostTitle}</p>
        <p><strong>Author:</strong> ${safeAuthor}</p>
        <p><strong>Message:</strong></p>
        <div style="padding: 12px 14px; border-radius: 12px; background: #f7f0e5; border: 1px solid #ddc8aa;">
          ${safeMessage}
        </div>
        ${
          postLink
            ? `<p style="margin-top: 16px;"><a href="${postLink}" style="color: #1f5f76;">Open the blog post</a></p>`
            : ""
        }
      </div>
    `,
  });
}
