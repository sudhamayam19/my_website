"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { DiscussionTopic } from "@/lib/discussions";
import { PhotoPicker } from "@/components/admin/PhotoPicker";

const CATEGORIES = ["General", "Cricket", "Telugu Culture", "Women & Life", "Podcast", "Writing"];

const DEFAULT_GUIDELINES =
  "• Keep it respectful — everyone's view matters.\n" +
  "• Stay on the topic above.\n" +
  "• Share your own experience, not just opinions.\n" +
  "• No promotions or abusive language.";

export function DiscussionsAdmin() {
  const [topics, setTopics] = useState<DiscussionTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [guidelines, setGuidelines] = useState(DEFAULT_GUIDELINES);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/discussions", { credentials: "same-origin" });
      const data = (await res.json()) as { topics?: DiscussionTopic[] };
      setTopics(data.topics ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ title, body, guidelines, imageUrl, category }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !data.id) throw new Error(data.error ?? "Could not open discussion.");
      setTitle(""); setBody(""); setGuidelines(DEFAULT_GUIDELINES); setImageUrl("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (id: string, status: "approved" | "hidden") => {
    await fetch("/api/admin/discussions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ id, status }),
    });
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this discussion and all its responses?")) return;
    await fetch(`/api/admin/discussions?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    await load();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="display-font text-3xl font-bold text-[#1f2d39]">💬 Discussions</h1>
          <p className="text-sm text-[#5f6f79]">Open a topic for your readers to discuss</p>
        </div>
        <Link href="/discussions" className="rounded-full border border-[#d3c1a8] px-4 py-2 text-sm font-bold text-[#1f6973] hover:border-[#1f6973]">
          View page
        </Link>
      </div>

      {/* Composer */}
      <form onSubmit={create} className="rounded-2xl border border-[#d8c8b0] bg-[#fffaf3] p-6 space-y-4">
        <h2 className="display-font text-xl font-bold text-[#1f2d39]">Open a new discussion</h2>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title — e.g. Is cricket losing its soul to money?"
            maxLength={140}
            required
            className="rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1f6973]"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-[#d8c8b0] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1f6973]"
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[#2a6670]">
            The line to discuss
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write the thought or question you want people to respond to…"
            rows={4}
            required
            className="mt-1 w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-3 text-sm leading-relaxed outline-none focus:border-[#1f6973]"
          />
        </div>

        <PhotoPicker value={imageUrl} onChange={setImageUrl} label="Image (optional)" />

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[#2a6670]">
            Guidelines (shown to readers)
          </label>
          <textarea
            value={guidelines}
            onChange={(e) => setGuidelines(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-xl border border-[#d8c8b0] bg-white px-4 py-3 text-sm leading-relaxed outline-none focus:border-[#1f6973]"
          />
        </div>

        {error && <p className="text-sm font-semibold text-[#c04a2a]">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-[#1f6973] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#185860] disabled:opacity-50"
        >
          {busy ? "Opening…" : "Open discussion"}
        </button>
      </form>

      {/* Existing */}
      <div className="space-y-2">
        <h2 className="display-font text-xl font-bold text-[#1f2d39]">
          All discussions {topics.length > 0 && `(${topics.length})`}
        </h2>
        {loading ? (
          <p className="text-sm text-[#8fa3ad]">Loading…</p>
        ) : topics.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#d3c1a8] bg-[#fffaf2] px-6 py-10 text-center text-sm text-[#8fa3ad]">
            No discussions yet — open your first one above.
          </p>
        ) : (
          topics.map((t) => (
            <div key={t.id} className="rounded-2xl border border-[#e0d4c0] bg-[#fffaf2] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-[#1f2d39]">{t.title}</p>
                  <p className="text-xs text-[#8fa3ad]">
                    {t.category} · {t.replyCount} {t.replyCount === 1 ? "response" : "responses"}
                    {t.status !== "approved" && ` · ${t.status}`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Link
                    href={`/discussions/${t.id}`}
                    className="rounded-full border border-[#d3c1a8] px-2.5 py-1 text-[11px] font-bold text-[#5f6f79] hover:border-[#1f6973] hover:text-[#1f6973]"
                  >
                    Open
                  </Link>
                  <button
                    onClick={() => void setStatus(t.id, t.status === "approved" ? "hidden" : "approved")}
                    className="rounded-full border border-[#d3c1a8] px-2.5 py-1 text-[11px] font-bold text-[#5f6f79] hover:border-[#1f6973] hover:text-[#1f6973]"
                  >
                    {t.status === "approved" ? "Hide" : "Show"}
                  </button>
                  <button
                    onClick={() => void remove(t.id)}
                    className="rounded-full border border-[#e8c0c0] px-2.5 py-1 text-[11px] font-bold text-[#c08080] hover:bg-red-50"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
