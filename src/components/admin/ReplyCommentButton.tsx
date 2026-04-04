"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ReplyCommentButtonProps {
  commentId: string;
  postId: string;
}

export function ReplyCommentButton({ commentId, postId }: ReplyCommentButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/comments/${commentId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, message }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Unable to post reply.");
      }

      setMessage("");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to post reply.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-[#b5cfd1] px-3 py-1 text-xs font-semibold text-[#2a6670] transition hover:bg-[#edf7f6]"
      >
        Reply
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write your reply..."
        rows={3}
        className="w-full rounded-xl border border-[#c8dfe0] bg-[#f4fbfb] px-3 py-2 text-sm text-[#1e2f3b] placeholder-[#8a9da4] focus:outline-none focus:ring-2 focus:ring-[#2a6670]"
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !message.trim()}
          className="rounded-full bg-[#1f6973] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#17555d] disabled:opacity-60"
        >
          {submitting ? "Posting..." : "Post Reply"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setMessage("");
            setError("");
          }}
          className="rounded-full border border-[#c7b294] px-4 py-1.5 text-xs font-semibold text-[#4f5f69] transition hover:bg-[#f6efe3]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
