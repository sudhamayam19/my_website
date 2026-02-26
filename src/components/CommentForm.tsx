"use client";

import { useState } from "react";
import type { BlogComment } from "@/lib/site-data";

interface CommentFormProps {
  postId: string;
  onCommentAdded?: (comment: BlogComment) => void;
}

export function CommentForm({ postId, onCommentAdded }: CommentFormProps) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanName = name.trim();
    const cleanMessage = message.trim();

    if (!cleanName || !cleanMessage) {
      setStatus("error");
      setFeedback("Please complete both fields.");
      return;
    }

    setStatus("loading");
    setFeedback("");

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          name: cleanName,
          message: cleanMessage,
        }),
      });

      const data = (await response.json()) as
        | { comment?: BlogComment; error?: string }
        | undefined;

      if (!response.ok || !data?.comment) {
        throw new Error(data?.error || "Failed to save comment.");
      }

      onCommentAdded?.(data.comment);
      setStatus("success");
      setFeedback("Comment posted.");
      setName("");
      setMessage("");
    } catch (error) {
      setStatus("error");
      setFeedback(
        error instanceof Error ? error.message : "Unable to post comment right now.",
      );
    }
  };

  return (
    <div className="editorial-card mt-8 rounded-2xl p-6">
      <h4 className="display-font text-2xl font-semibold text-[#1f2c38]">Leave a Comment</h4>
      <p className="mt-1 text-sm text-[#50606a]">
        Share your thoughts. Comments are now saved and shown here.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#304b57]">Name</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            disabled={status === "loading"}
            className="w-full rounded-xl border border-[#c7b294] bg-[#fffefb] px-4 py-3 text-sm shadow-sm outline-none ring-[#2a6670] transition focus:ring"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-[#304b57]">Comment</span>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Write your comment"
            rows={4}
            disabled={status === "loading"}
            className="w-full rounded-xl border border-[#c7b294] bg-[#fffefb] px-4 py-3 text-sm shadow-sm outline-none ring-[#2a6670] transition focus:ring"
            required
          />
        </label>

        {status === "error" ? (
          <p className="text-sm font-medium text-red-600">{feedback}</p>
        ) : null}
        {status === "success" ? (
          <p className="text-sm font-medium text-emerald-600">{feedback}</p>
        ) : null}

        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex items-center rounded-full bg-gradient-to-r from-[#215c66] to-[#b6563f] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "loading" ? "Posting..." : "Post Comment"}
        </button>
      </form>
    </div>
  );
}
