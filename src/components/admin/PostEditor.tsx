"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { BlogPost, PostStatus } from "@/lib/site-data";

interface PostEditorProps {
  mode: "create" | "edit";
  initialPost?: BlogPost;
}

const gradientOptions = [
  "from-[#1f6a6d] to-[#4ea59e]",
  "from-[#9e3d2d] to-[#d38d59]",
  "from-[#7d6a33] to-[#bfad67]",
  "from-[#2f4f77] to-[#4f7ea8]",
  "from-[#8d493d] to-[#c48451]",
  "from-[#455a35] to-[#879f5f]",
];

export function PostEditor({ mode, initialPost }: PostEditorProps) {
  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? "");
  const [category, setCategory] = useState(initialPost?.category ?? "Voice Acting");
  const [readTimeMinutes, setReadTimeMinutes] = useState<number>(
    initialPost?.readTimeMinutes ?? 5,
  );
  const [status, setStatus] = useState<PostStatus>(initialPost?.status ?? "draft");
  const [coverGradient, setCoverGradient] = useState(
    initialPost?.coverGradient ?? gradientOptions[0],
  );
  const [contentInput, setContentInput] = useState(
    initialPost?.content.join("\n\n") ?? "",
  );
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const previewParagraphs = useMemo(() => {
    return contentInput
      .split(/\n{2,}/)
      .map((value) => value.trim())
      .filter(Boolean);
  }, [contentInput]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    window.setTimeout(() => {
      setIsSaving(false);
      setFeedback(
        mode === "create"
          ? "Draft created in frontend preview mode. Connect backend to persist."
          : "Post updated in frontend preview mode. Connect backend to persist.",
      );
    }, 700);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display-font text-4xl font-extrabold text-[#1f2d39]">
            {mode === "create" ? "Create Post" : "Edit Post"}
          </h1>
          <p className="mt-2 text-sm text-[#51616a]">
            This editor is complete frontend UI and ready for backend wiring.
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-full border border-[#c9b294] bg-white px-5 py-2 text-sm font-semibold text-[#264f58] transition hover:border-[#b89772] hover:bg-[#f5eee3]"
        >
          Back to Admin
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <form
          onSubmit={handleSubmit}
          className="editorial-card p-6 sm:p-8"
        >
          <div className="grid gap-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#304b57]">
                Title
              </span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                className="w-full rounded-xl border border-[#c8b397] bg-[#fffefb] px-4 py-3 text-sm outline-none ring-[#2a6670] transition focus:ring"
                placeholder="Post title"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#304b57]">
                Excerpt
              </span>
              <textarea
                value={excerpt}
                onChange={(event) => setExcerpt(event.target.value)}
                required
                rows={3}
                className="w-full rounded-xl border border-[#c8b397] bg-[#fffefb] px-4 py-3 text-sm outline-none ring-[#2a6670] transition focus:ring"
                placeholder="Short summary shown on cards"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#304b57]">
                  Category
                </span>
                <input
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  required
                  className="w-full rounded-xl border border-[#c8b397] bg-[#fffefb] px-4 py-3 text-sm outline-none ring-[#2a6670] transition focus:ring"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#304b57]">
                  Read Time
                </span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={readTimeMinutes}
                  onChange={(event) => setReadTimeMinutes(Number(event.target.value))}
                  className="w-full rounded-xl border border-[#c8b397] bg-[#fffefb] px-4 py-3 text-sm outline-none ring-[#2a6670] transition focus:ring"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#304b57]">
                  Status
                </span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as PostStatus)}
                  className="w-full rounded-xl border border-[#c8b397] bg-[#fffefb] px-4 py-3 text-sm outline-none ring-[#2a6670] transition focus:ring"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#304b57]">
                Cover Gradient
              </span>
              <select
                value={coverGradient}
                onChange={(event) => setCoverGradient(event.target.value)}
                className="w-full rounded-xl border border-[#c8b397] bg-[#fffefb] px-4 py-3 text-sm outline-none ring-[#2a6670] transition focus:ring"
              >
                {gradientOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#304b57]">
                Content
              </span>
              <textarea
                value={contentInput}
                onChange={(event) => setContentInput(event.target.value)}
                required
                rows={13}
                className="w-full rounded-xl border border-[#c8b397] bg-[#fffefb] px-4 py-3 text-sm outline-none ring-[#2a6670] transition focus:ring"
                placeholder="Separate paragraphs with a blank line"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-gradient-to-r from-[#215c66] to-[#b6563f] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Saving..." : mode === "create" ? "Create Draft" : "Save Changes"}
            </button>
            {feedback ? <p className="text-sm font-medium text-emerald-600">{feedback}</p> : null}
          </div>
        </form>

        <aside className="editorial-card p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#2a6670]">
            Live Preview
          </p>
          <div className={`mt-4 h-32 rounded-2xl bg-gradient-to-br ${coverGradient}`} />
          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-[#5f6f79]">
            {category || "Category"}
          </p>
          <h2 className="display-font mt-2 text-2xl font-bold text-[#1f2d39]">
            {title || "Post title preview"}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#4f5f69]">
            {excerpt || "Post excerpt preview."}
          </p>
          <p className="mt-3 text-xs font-medium text-[#5f6f79]">
            {readTimeMinutes} min read | {status}
          </p>

          <div className="mt-5 space-y-3 border-t border-[#d8c8b0] pt-5">
            {previewParagraphs.length ? (
              previewParagraphs.slice(0, 3).map((paragraph) => (
                <p key={paragraph} className="text-sm leading-relaxed text-[#455963]">
                  {paragraph}
                </p>
              ))
            ) : (
              <p className="text-sm text-[#60717b]">Content preview appears here.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
