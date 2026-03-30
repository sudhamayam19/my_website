import { getAdminPushTokens } from "@/lib/content-store";
import type { CommentStatus } from "@/lib/site-data";

interface CommentPushNotificationInput {
  postId: string;
  postTitle?: string;
  author: string;
  message: string;
  status: CommentStatus;
}

function isExpoPushToken(token: string): boolean {
  return /^Expo(nent)?PushToken\[.+\]$/.test(token.trim());
}

function truncate(value: string, length: number): string {
  if (value.length <= length) {
    return value;
  }

  return `${value.slice(0, length - 1)}…`;
}

export async function sendCommentPushNotifications({
  postId,
  postTitle,
  author,
  message,
  status,
}: CommentPushNotificationInput): Promise<void> {
  const tokens = (await getAdminPushTokens()).filter(isExpoPushToken);
  if (!tokens.length) {
    return;
  }

  const title =
    status === "pending" ? "New comment needs approval" : `New comment on ${postTitle || "your blog"}`;
  const body = truncate(`${author}: ${message.replace(/\s+/g, " ").trim()}`, 140);

  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      tokens.map((token) => ({
        to: token,
        sound: "default",
        title,
        body,
        data: {
          screen: "comments",
          postId,
          status,
        },
      })),
    ),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to send Expo push notification.", errorText);
  }
}
