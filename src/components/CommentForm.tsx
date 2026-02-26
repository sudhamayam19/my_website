"use client";

import { useState } from "react";

export interface CommentPayload {
  name: string;
  message: string;
}

interface CommentFormProps {
  onCommentAdded?: (payload: CommentPayload) => void;
}

export function CommentForm({ onCommentAdded }: CommentFormProps) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanName = name.trim();
    const cleanMessage = message.trim();

    if (!cleanName || !cleanMessage) {
      setStatus("error");
      setFeedback("Please complete both fields.");
      return;
    }

    setStatus("loading");
    window.setTimeout(() => {
      onCommentAdded?.({ name: cleanName, message: cleanMessage });
      setStatus("success");
      setFeedback("Comment added to this page preview.");
      setName("");
      setMessage("");
    }, 500);
  };

  return (
    <div className="editorial-card mt-8 rounded-2xl p-6">
      <h4 className="display-font text-2xl font-semibold text-[#1f2c38]">Leave a Comment</h4>
      <p className="mt-1 text-sm text-[#50606a]">
        Comments are currently frontend-only and will be connected to backend later.
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
