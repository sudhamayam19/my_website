"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const CATEGORIES = ["General", "Cricket", "Telugu Culture", "Women & Life", "Podcast", "Writing"];

export function NewTopicForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/community/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, title, body, category }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !data.id) throw new Error(data.error ?? "Could not start discussion.");
      setAuthor(""); setTitle(""); setBody(""); setOpen(false);
      router.push(`/community/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-[#1f6973] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#185860]"
      >
        ✍️ Start a discussion
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-[#d8c8b0] bg-[#fffaf3] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="display-font text-xl font-bold text-[#1f2d39]">Start a discussion</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-[#8fa3ad] hover:text-[#1f2d39]">
          Cancel
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Your name"
          maxLength={60}
          required
          className="rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5 text-sm text-[#1f2d39] outline-none focus:border-[#1f6973]"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5 text-sm text-[#1f2d39] outline-none focus:border-[#1f6973]"
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What do you want to talk about?"
        maxLength={140}
        required
        className="w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5 text-sm text-[#1f2d39] outline-none focus:border-[#1f6973]"
      />

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share your thoughts…"
        rows={5}
        maxLength={5000}
        required
        className="w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-3 text-sm leading-relaxed text-[#1f2d39] outline-none focus:border-[#1f6973]"
      />

      {error && <p className="text-sm font-semibold text-[#c04a2a]">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-[#1f6973] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#185860] disabled:opacity-50"
      >
        {busy ? "Posting…" : "Post discussion"}
      </button>
    </form>
  );
}
