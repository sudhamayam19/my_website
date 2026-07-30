"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TopicReplyForm({ topicId }: { topicId: string }) {
  const router = useRouter();
  const [author, setAuthor] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/community/topics/${topicId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, message }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not post reply.");
      setMessage("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-[#d8c8b0] bg-[#fffaf3] p-5 space-y-3">
      <h3 className="font-bold text-[#1f2d39]">Join the conversation</h3>
      <input
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        placeholder="Your name"
        maxLength={60}
        required
        className="w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5 text-sm text-[#1f2d39] outline-none focus:border-[#1f6973]"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write your reply…"
        rows={4}
        maxLength={5000}
        required
        className="w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-3 text-sm leading-relaxed text-[#1f2d39] outline-none focus:border-[#1f6973]"
      />
      {error && <p className="text-sm font-semibold text-[#c04a2a]">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-[#1f6973] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#185860] disabled:opacity-50"
      >
        {busy ? "Posting…" : "Post reply"}
      </button>
    </form>
  );
}
