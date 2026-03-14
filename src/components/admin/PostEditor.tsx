"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { RichTextRenderer } from "@/components/RichTextRenderer";
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

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PostEditor({ mode, initialPost }: PostEditorProps) {
  const router = useRouter();
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? "");
  const [category, setCategory] = useState(initialPost?.category ?? "Voice Acting");
  const [publishedAt, setPublishedAt] = useState(initialPost?.publishedAt ?? getTodayDateString());
  const [readTimeMinutes, setReadTimeMinutes] = useState<number>(
    initialPost?.readTimeMinutes ?? 5,
  );
  const [status, setStatus] = useState<PostStatus>(initialPost?.status ?? "draft");
  const [featured, setFeatured] = useState(initialPost?.featured ?? false);
  const [coverImageUrl, setCoverImageUrl] = useState(initialPost?.coverImageUrl ?? "");
  const [coverGradient, setCoverGradient] = useState(
    initialPost?.coverGradient ?? gradientOptions[0],
  );
  const [seoDescription, setSeoDescription] = useState(
    initialPost?.seoDescription ?? initialPost?.excerpt ?? "",
  );
  const [contentInput, setContentInput] = useState(initialPost?.content.join("\n\n") ?? "");
  const [feedback, setFeedback] = useState("");
  const [feedbackState, setFeedbackState] = useState<"idle" | "success" | "error">("idle");
  const [isSaving, setIsSaving] = useState(false);

  const previewParagraphs = useMemo(() => {
    return contentInput
      .split(/\n{2,}/)
      .map((value) => value.trim())
      .filter(Boolean);
  }, [contentInput]);

  const insertAroundSelection = (prefix: string, suffix: string, placeholder: string) => {
    const textarea = contentRef.current;
    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = contentInput.slice(start, end);
    const coreText = selectedText || placeholder;
    const replacement = `${prefix}${coreText}${suffix}`;
    const nextValue = `${contentInput.slice(0, start)}${replacement}${contentInput.slice(end)}`;
    setContentInput(nextValue);

    window.requestAnimationFrame(() => {
      textarea.focus();
      const cursorStart = start + prefix.length;
      textarea.setSelectionRange(cursorStart, cursorStart + coreText.length);
    });
  };

  const insertSnippet = (snippet: string) => {
    const textarea = contentRef.current;
    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextValue = `${contentInput.slice(0, start)}${snippet}${contentInput.slice(end)}`;
    setContentInput(nextValue);

    window.requestAnimationFrame(() => {
      const cursorPos = start + snippet.length;
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback("");
    setFeedbackState("idle");

    const payload = {
      title: title.trim(),
      excerpt: excerpt.trim(),
      category: category.trim(),
      publishedAt,
      readTimeMinutes,
      status,
      featured,
      coverGradient,
      coverImageUrl: coverImageUrl.trim() || undefined,
      seoDescription: seoDescription.trim() || excerpt.trim(),
      content: previewParagraphs,
    };

    if (!payload.title || !payload.excerpt || !payload.category || payload.content.length === 0) {
      setIsSaving(false);
      setFeedbackState("error");
      setFeedback("Title, excerpt, category, and content are required.");
      return;
    }

    try {
      const endpoint =
        mode === "create" ? "/api/admin/posts" : `/api/admin/posts/${initialPost?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as
        | { post?: { id: string }; error?: string }
        | undefined;
      if (!response.ok || !data?.post?.id) {
        throw new Error(data?.error || "Failed to save post.");
      }

      setFeedbackState("success");
      setFeedback(mode === "create" ? "Post created." : "Post updated.");
      router.refresh();

      if (mode === "create") {
        router.push(`/admin/posts/${data.post.id}/edit`);
      }
    } catch (error) {
      setFeedbackState("error");
      setFeedback(error instanceof Error ? error.message : "Unable to save post.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display-font text-4xl font-extrabold text-[#1f2d39]">
            {mode === "create" ? "Create Post" : "Edit Post"}
          </h1>
          <p className="mt-2 text-sm text-[#51616a]">
            Posts are saved to Convex and shown on the public blog.
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
        <form onSubmit={handleSubmit} className="editorial-card p-6 sm:p-8">
          <div className="grid gap-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#304b57]">Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                className="w-full rounded-xl border border-[#c8b397] bg-[#fffefb] px-4 py-3 text-sm outline-none ring-[#2a6670] transition focus:ring"
                placeholder="Post title"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#304b57]">Excerpt</span>
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
                <span className="mb-2 block text-sm font-medium text-[#304b57]">Category</span>
                <input
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  required
                  className="w-full rounded-xl border border-[#c8b397] bg-[#fffefb] px-4 py-3 text-sm outline-none ring-[#2a6670] transition focus:ring"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#304b57]">Published</span>
                <input
                  type="date"
                  value={publishedAt}
                  onChange={(event) => setPublishedAt(event.target.value)}
                  className="w-full rounded-xl border border-[#c8b397] bg-[#fffefb] px-4 py-3 text-sm outline-none ring-[#2a6670] transition focus:ring"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#304b57]">Read Time</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={readTimeMinutes}
                  onChange={(event) => setReadTimeMinutes(Number(event.target.value))}
                  className="w-full rounded-xl border border-[#c8b397] bg-[#fffefb] px-4 py-3 text-sm outline-none ring-[#2a6670] transition focus:ring"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#304b57]">Status</span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as PostStatus)}
                  className="w-full rounded-xl border border-[#c8b397] bg-[#fffefb] px-4 py-3 text-sm outline-none ring-[#2a6670] transition focus:ring"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>

              <label className="flex items-center gap-2 pt-8 text-sm font-medium text-[#304b57]">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(event) => setFeatured(event.target.checked)}
                  className="h-4 w-4 rounded border-[#c8b397] text-[#2a6670] focus:ring-[#2a6670]"
                />
                Feature on homepage
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#304b57]">SEO Description</span>
              <textarea
                value={seoDescription}
                onChange={(event) => setSeoDescription(event.target.value)}
                rows={2}
                className="w-full rounded-xl border border-[#c8b397] bg-[#fffefb] px-4 py-3 text-sm outline-none ring-[#2a6670] transition focus:ring"
                placeholder="Meta description for search previews"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#304b57]">Cover Image URL</span>
              <input
                value={coverImageUrl}
                onChange={(event) => setCoverImageUrl(event.target.value)}
                className="w-full rounded-xl border border-[#c8b397] bg-[#fffefb] px-4 py-3 text-sm outline-none ring-[#2a6670] transition focus:ring"
                placeholder="https://example.com/cover.jpg"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#304b57]">Cover Gradient</span>
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
              <span className="mb-2 block text-sm font-medium text-[#304b57]">Content</span>
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => insertAroundSelection("**", "**", "bold text")}
                  className="rounded-full border border-[#c8b397] bg-[#fff8ed] px-3 py-1 text-xs font-semibold text-[#2f4f5a] transition hover:bg-[#f4e8d6]"
                >
                  Bold
                </button>
                <button
                  type="button"
                  onClick={() => insertAroundSelection("*", "*", "italic text")}
                  className="rounded-full border border-[#c8b397] bg-[#fff8ed] px-3 py-1 text-xs font-semibold text-[#2f4f5a] transition hover:bg-[#f4e8d6]"
                >
                  Italic
                </button>
                <button
                  type="button"
                  onClick={() => insertAroundSelection("[", "](https://example.com)", "link text")}
                  className="rounded-full border border-[#c8b397] bg-[#fff8ed] px-3 py-1 text-xs font-semibold text-[#2f4f5a] transition hover:bg-[#f4e8d6]"
                >
                  Link
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet("## Heading")}
                  className="rounded-full border border-[#c8b397] bg-[#fff8ed] px-3 py-1 text-xs font-semibold text-[#2f4f5a] transition hover:bg-[#f4e8d6]"
                >
                  Heading
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet("- List item 1\n- List item 2")}
                  className="rounded-full border border-[#c8b397] bg-[#fff8ed] px-3 py-1 text-xs font-semibold text-[#2f4f5a] transition hover:bg-[#f4e8d6]"
                >
                  List
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet("> Quote line")}
                  className="rounded-full border border-[#c8b397] bg-[#fff8ed] px-3 py-1 text-xs font-semibold text-[#2f4f5a] transition hover:bg-[#f4e8d6]"
                >
                  Quote
                </button>
              </div>
              <textarea
                ref={contentRef}
                value={contentInput}
                onChange={(event) => setContentInput(event.target.value)}
                required
                rows={13}
                className="w-full rounded-xl border border-[#c8b397] bg-[#fffefb] px-4 py-3 text-sm outline-none ring-[#2a6670] transition focus:ring"
                placeholder="Supports markdown. Separate blocks with a blank line."
              />
              <p className="mt-2 text-xs text-[#5f6f79]">
                Tip: use **bold**, *italic*, [link](https://example.com), headings (##), lists (- item), and quotes (&gt; text).
              </p>
            </label>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-gradient-to-r from-[#215c66] to-[#b6563f] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Saving..." : mode === "create" ? "Create Post" : "Save Changes"}
            </button>
            {feedback ? (
              <p
                className={`text-sm font-medium ${
                  feedbackState === "error" ? "text-red-600" : "text-emerald-600"
                }`}
              >
                {feedback}
              </p>
            ) : null}
          </div>
        </form>

        <aside className="editorial-card p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#2a6670]">
            Live Preview
          </p>
          <div
            className={`mt-4 h-32 rounded-2xl ${
              coverImageUrl ? "" : `bg-gradient-to-br ${coverGradient}`
            }`}
            style={
              coverImageUrl
                ? {
                    backgroundImage: `url(${coverImageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          />
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
              <RichTextRenderer blocks={previewParagraphs.slice(0, 3)} />
            ) : (
              <p className="text-sm text-[#60717b]">Content preview appears here.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
