"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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
const maxCoverImageSizeBytes = 4_000_000;
const maxArticleImageSizeBytes = 4_000_000;
const formatButtons = [
  { label: "B", title: "Bold", action: "bold" },
  { label: "I", title: "Italic", action: "italic" },
  { label: "U", title: "Underline", action: "underline" },
  { label: "Link", title: "Link", action: "link" },
  { label: "H1", title: "Large heading", action: "heading1" },
  { label: "H2", title: "Section heading", action: "heading2" },
  { label: "H3", title: "Small heading", action: "heading3" },
  { label: "List", title: "List", action: "list" },
  { label: "1.", title: "Numbered list", action: "orderedList" },
  { label: "Image", title: "Insert image", action: "image" },
  { label: "Quote", title: "Quote", action: "quote" },
] as const;

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function toEditorSnapshot(value: {
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  readTimeMinutes: number;
  status: PostStatus;
  featured: boolean;
  coverGradient: string;
  coverImageUrl: string;
  seoDescription: string;
  contentInput: string;
}): string {
  return JSON.stringify(value);
}

function hasLegacyInlineImage(value: string): boolean {
  return value.includes("data:image/");
}

function scrubLegacyInlineImages(value: string): string {
  return value.replace(
    /!\[([^\]]*)\]\(data:image\/[^)]+\)/g,
    "[Legacy inline image removed. Please upload it again.]",
  );
}

async function uploadImageFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/admin/uploads", {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as { url?: string; error?: string } | undefined;
  if (!response.ok || !data?.url) {
    throw new Error(data?.error || "Unable to upload image.");
  }

  return data.url;
}

export function PostEditor({ mode, initialPost }: PostEditorProps) {
  const router = useRouter();
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const articleImageInputRef = useRef<HTMLInputElement | null>(null);
  const articleImageSelectionRef = useRef({ start: 0, end: 0 });
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
  const [hasHydratedDraft, setHasHydratedDraft] = useState(false);
  const [isUploadingCoverImage, setIsUploadingCoverImage] = useState(false);
  const [isUploadingArticleImage, setIsUploadingArticleImage] = useState(false);
  const [coverImageFeedback, setCoverImageFeedback] = useState("");
  const [coverImageFeedbackState, setCoverImageFeedbackState] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [articleImageFeedback, setArticleImageFeedback] = useState("");
  const [articleImageFeedbackState, setArticleImageFeedbackState] = useState<
    "idle" | "success" | "error"
  >("idle");

  const autosaveKey = useMemo(() => {
    return mode === "edit" && initialPost?.id
      ? `post-editor-draft:${initialPost.id}`
      : "post-editor-draft:new";
  }, [initialPost?.id, mode]);

  const previewParagraphs = useMemo(() => {
    return contentInput
      .split(/\n{2,}/)
      .map((value) => value.trim())
      .filter(Boolean);
  }, [contentInput]);

  const editorSnapshot = useMemo(() => {
    return toEditorSnapshot({
      title,
      excerpt,
      category,
      publishedAt,
      readTimeMinutes,
      status,
      featured,
      coverGradient,
      coverImageUrl,
      seoDescription,
      contentInput,
    });
  }, [
    category,
    contentInput,
    coverGradient,
    coverImageUrl,
    excerpt,
    featured,
    publishedAt,
    readTimeMinutes,
    seoDescription,
    status,
    title,
  ]);

  const initialSnapshot = useMemo(() => {
    return toEditorSnapshot({
      title: initialPost?.title ?? "",
      excerpt: initialPost?.excerpt ?? "",
      category: initialPost?.category ?? "Voice Acting",
      publishedAt: initialPost?.publishedAt ?? getTodayDateString(),
      readTimeMinutes: initialPost?.readTimeMinutes ?? 5,
      status: initialPost?.status ?? "draft",
      featured: initialPost?.featured ?? false,
      coverGradient: initialPost?.coverGradient ?? gradientOptions[0],
      coverImageUrl: initialPost?.coverImageUrl ?? "",
      seoDescription: initialPost?.seoDescription ?? initialPost?.excerpt ?? "",
      contentInput: initialPost?.content.join("\n\n") ?? "",
    });
  }, [initialPost]);

  const [lastSavedSnapshot, setLastSavedSnapshot] = useState(initialSnapshot);
  const isDirty = editorSnapshot !== lastSavedSnapshot;

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

  const insertImageAtSelection = (markdown: string) => {
    const textarea = contentRef.current;
    const fallbackStart = textarea?.selectionStart ?? contentInput.length;
    const fallbackEnd = textarea?.selectionEnd ?? contentInput.length;
    const start = articleImageSelectionRef.current.start ?? fallbackStart;
    const end = articleImageSelectionRef.current.end ?? fallbackEnd;

    setContentInput((current) => {
      const safeStart = Math.min(start, current.length);
      const safeEnd = Math.min(end, current.length);
      const prefix =
        safeStart > 0 && !current.slice(0, safeStart).endsWith("\n\n") ? "\n\n" : "";
      const suffix =
        safeEnd < current.length && !current.slice(safeEnd).startsWith("\n\n") ? "\n\n" : "";
      return `${current.slice(0, safeStart)}${prefix}${markdown}${suffix}${current.slice(safeEnd)}`;
    });

    window.requestAnimationFrame(() => {
      const nextTextarea = contentRef.current;
      if (!nextTextarea) {
        return;
      }

      const cursorPos = Math.min(start + markdown.length + 2, nextTextarea.value.length);
      nextTextarea.focus();
      nextTextarea.setSelectionRange(cursorPos, cursorPos);
    });
  };

  const applyToolbarAction = (action: (typeof formatButtons)[number]["action"]) => {
    if (action === "bold") {
      insertAroundSelection("**", "**", "bold text");
      return;
    }

    if (action === "italic") {
      insertAroundSelection("*", "*", "italic text");
      return;
    }

    if (action === "underline") {
      insertAroundSelection("<u>", "</u>", "underlined text");
      return;
    }

    if (action === "link") {
      insertAroundSelection("[", "](https://example.com)", "link text");
      return;
    }

    if (action === "heading1") {
      insertSnippet("# Heading");
      return;
    }

    if (action === "heading2") {
      insertSnippet("## Heading");
      return;
    }

    if (action === "heading3") {
      insertSnippet("### Heading");
      return;
    }

    if (action === "list") {
      insertSnippet("- List item 1\n- List item 2");
      return;
    }

    if (action === "orderedList") {
      insertSnippet("1. First item\n2. Second item");
      return;
    }

    if (action === "image") {
      const textarea = contentRef.current;
      articleImageSelectionRef.current = {
        start: textarea?.selectionStart ?? contentInput.length,
        end: textarea?.selectionEnd ?? contentInput.length,
      };
      articleImageInputRef.current?.click();
      return;
    }

    insertSnippet("> Quote line");
  };

  const handleEditorKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(event.ctrlKey || event.metaKey)) {
      return;
    }

    const key = event.key.toLowerCase();
    if (key === "b") {
      event.preventDefault();
      applyToolbarAction("bold");
      return;
    }

    if (key === "i") {
      event.preventDefault();
      applyToolbarAction("italic");
      return;
    }

    if (key === "u") {
      event.preventDefault();
      applyToolbarAction("underline");
    }
  };

  const handleArticleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setArticleImageFeedback("");
    setArticleImageFeedbackState("idle");

    if (!file.type.startsWith("image/")) {
      setFeedbackState("error");
      setFeedback("Please choose an image file for the article.");
      setArticleImageFeedbackState("error");
      setArticleImageFeedback("Please choose an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > maxArticleImageSizeBytes) {
      setFeedbackState("error");
      setFeedback("Article images must be smaller than 4 MB.");
      setArticleImageFeedbackState("error");
      setArticleImageFeedback("Image is too large. Use a file smaller than 4 MB.");
      event.target.value = "";
      return;
    }

    try {
      setIsUploadingArticleImage(true);
      const uploadedUrl = await uploadImageFile(file);
      insertImageAtSelection(`![${file.name}](${uploadedUrl})`);
      setFeedbackState("success");
      setFeedback(`Inserted image into article: ${file.name}`);
      setArticleImageFeedbackState("success");
      setArticleImageFeedback(`Inserted image: ${file.name}`);
    } catch (error) {
      setFeedbackState("error");
      setFeedback(error instanceof Error ? error.message : "Unable to insert image.");
      setArticleImageFeedbackState("error");
      setArticleImageFeedback(
        error instanceof Error ? error.message : "Unable to insert image.",
      );
    } finally {
      setIsUploadingArticleImage(false);
      event.target.value = "";
    }
  };

  const handleCoverImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setCoverImageFeedback("");
    setCoverImageFeedbackState("idle");

    if (!file.type.startsWith("image/")) {
      setFeedbackState("error");
      setFeedback("Please choose an image file.");
      setCoverImageFeedbackState("error");
      setCoverImageFeedback("Please choose an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > maxCoverImageSizeBytes) {
      setFeedbackState("error");
      setFeedback("Cover image must be smaller than 4 MB.");
      setCoverImageFeedbackState("error");
      setCoverImageFeedback("Image is too large. Use a file smaller than 4 MB.");
      event.target.value = "";
      return;
    }

    try {
      setIsUploadingCoverImage(true);
      const nextImageUrl = await uploadImageFile(file);
      setCoverImageUrl(nextImageUrl);
      setFeedbackState("success");
      setFeedback(`Selected cover image: ${file.name}`);
      setCoverImageFeedbackState("success");
      setCoverImageFeedback(`Selected cover image: ${file.name}`);
    } catch (error) {
      setFeedbackState("error");
      setFeedback(error instanceof Error ? error.message : "Unable to upload image.");
      setCoverImageFeedbackState("error");
      setCoverImageFeedback(error instanceof Error ? error.message : "Unable to upload image.");
    } finally {
      setIsUploadingCoverImage(false);
      event.target.value = "";
    }
  };

  const handleRemoveCoverImage = () => {
    setCoverImageUrl("");
    setFeedbackState("idle");
    setFeedback("");
    setCoverImageFeedbackState("idle");
    setCoverImageFeedback("");
  };

  useEffect(() => {
    setLastSavedSnapshot(initialSnapshot);
  }, [initialSnapshot]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedDraft = window.localStorage.getItem(autosaveKey);
    if (!savedDraft) {
      setHasHydratedDraft(true);
      return;
    }

    try {
      const parsed = JSON.parse(savedDraft) as Partial<{
        title: string;
        excerpt: string;
        category: string;
        publishedAt: string;
        readTimeMinutes: number;
        status: PostStatus;
        featured: boolean;
        coverGradient: string;
        coverImageUrl: string;
        seoDescription: string;
        contentInput: string;
      }>;
      let removedLegacyInlineImages = false;

      if (typeof parsed.title === "string") setTitle(parsed.title);
      if (typeof parsed.excerpt === "string") setExcerpt(parsed.excerpt);
      if (typeof parsed.category === "string") setCategory(parsed.category);
      if (typeof parsed.publishedAt === "string") setPublishedAt(parsed.publishedAt);
      if (typeof parsed.readTimeMinutes === "number") setReadTimeMinutes(parsed.readTimeMinutes);
      if (parsed.status === "draft" || parsed.status === "published") setStatus(parsed.status);
      if (typeof parsed.featured === "boolean") setFeatured(parsed.featured);
      if (typeof parsed.coverGradient === "string") setCoverGradient(parsed.coverGradient);
      if (typeof parsed.coverImageUrl === "string") {
        if (hasLegacyInlineImage(parsed.coverImageUrl)) {
          removedLegacyInlineImages = true;
          setCoverImageUrl("");
        } else {
          setCoverImageUrl(parsed.coverImageUrl);
        }
      }
      if (typeof parsed.seoDescription === "string") setSeoDescription(parsed.seoDescription);
      if (typeof parsed.contentInput === "string") {
        if (hasLegacyInlineImage(parsed.contentInput)) {
          removedLegacyInlineImages = true;
          setContentInput(scrubLegacyInlineImages(parsed.contentInput));
        } else {
          setContentInput(parsed.contentInput);
        }
      }
      setFeedbackState("success");
      setFeedback(
        removedLegacyInlineImages
          ? "Recovered your draft and removed old inline images. Please upload those images again."
          : "Recovered your unsaved draft.",
      );
    } catch {
      window.localStorage.removeItem(autosaveKey);
    } finally {
      setHasHydratedDraft(true);
    }
  }, [autosaveKey]);

  useEffect(() => {
    if (typeof window === "undefined" || !hasHydratedDraft) {
      return;
    }

    if (editorSnapshot === initialSnapshot) {
      window.localStorage.removeItem(autosaveKey);
      return;
    }

    window.localStorage.setItem(autosaveKey, editorSnapshot);
  }, [autosaveKey, editorSnapshot, hasHydratedDraft, initialSnapshot]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback("");
    setFeedbackState("idle");

    if (hasLegacyInlineImage(coverImageUrl) || hasLegacyInlineImage(contentInput)) {
      setIsSaving(false);
      setFeedbackState("error");
      setFeedback(
        "This draft still contains an old inline image. Remove it and upload the image again, then save.",
      );
      return;
    }

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
      setLastSavedSnapshot(editorSnapshot);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(autosaveKey);
      }
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

            <div className="block">
              <span className="mb-2 block text-sm font-medium text-[#304b57]">Cover Image</span>
              <div className="rounded-2xl border border-dashed border-[#c8b397] bg-[#fffaf2] p-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageUpload}
                  className="block w-full text-sm text-[#304b57] file:mr-4 file:rounded-full file:border-0 file:bg-[#215c66] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:opacity-95"
                />
                <p className="mt-2 text-xs text-[#5f6f79]">
                  Upload JPG, PNG, WEBP, or another image format up to 4 MB.
                </p>
                <p
                  className={`mt-2 text-xs ${
                    coverImageFeedbackState === "error"
                      ? "text-red-600"
                      : coverImageFeedbackState === "success"
                        ? "text-emerald-600"
                        : "text-[#5f6f79]"
                  }`}
                >
                  {coverImageFeedback ||
                    (isUploadingCoverImage
                      ? "Uploading cover image..."
                      : "This image appears at the top of the article card and post header.")}
                </p>
                {coverImageUrl ? (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <p className="text-xs text-[#5f6f79]">
                      A cover image is selected and will be saved with this post.
                    </p>
                    <button
                      type="button"
                      onClick={handleRemoveCoverImage}
                      className="rounded-full border border-[#c8b397] bg-white px-3 py-1 text-xs font-semibold text-[#304b57] transition hover:bg-[#f5eee3]"
                    >
                      Remove image
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

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
              <input
                ref={articleImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleArticleImageUpload}
                className="hidden"
              />
              <div className="mb-3 rounded-2xl border border-[#d7c4aa] bg-[#fff8ed] p-3">
                <div className="flex flex-wrap gap-2">
                  {formatButtons.map((button) => (
                    <button
                      key={button.action}
                      type="button"
                      title={button.title}
                      aria-label={button.title}
                      onClick={() => applyToolbarAction(button.action)}
                      className={`min-w-10 rounded-xl border border-[#c8b397] bg-white px-3 py-2 text-sm font-semibold text-[#2f4f5a] transition hover:bg-[#f4e8d6] ${
                        button.action === "italic"
                          ? "italic"
                          : button.action === "underline"
                            ? "underline"
                            : ""
                      }`}
                    >
                      {button.label}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-[#5f6f79]">
                  Type your text, highlight it with the mouse, then click B, I, or U to format it. Use Ctrl+B, Ctrl+I, or Ctrl+U for keyboard shortcuts.
                </p>
                <p
                  className={`mt-2 text-xs ${
                    articleImageFeedbackState === "error"
                      ? "text-red-600"
                      : articleImageFeedbackState === "success"
                        ? "text-emerald-600"
                        : "text-[#5f6f79]"
                  }`}
                >
                  {articleImageFeedback ||
                    (isUploadingArticleImage
                      ? "Uploading article image..."
                      : "Use Image to insert a picture into the article body. Max 4 MB.")}
                </p>
              </div>
              <textarea
                ref={contentRef}
                value={contentInput}
                onChange={(event) => setContentInput(event.target.value)}
                onKeyDown={handleEditorKeyDown}
                required
                rows={13}
                className="w-full rounded-xl border border-[#c8b397] bg-[#fffefb] px-4 py-3 text-sm outline-none ring-[#2a6670] transition focus:ring"
                placeholder="Supports markdown. Separate blocks with a blank line."
              />
              <p className="mt-2 text-xs text-[#5f6f79]">
                Tip: this editor supports bold, italic, underline, links, headings, lists, numbered lists, quotes, and uploaded article images in the live preview.
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
            {isDirty ? <p className="text-sm font-medium text-[#8a5a1d]">Unsaved changes</p> : null}
          </div>
        </form>

        <aside className="editorial-card p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#2a6670]">
            Live Preview
          </p>
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt={title || "Cover preview"}
              className="mt-4 h-32 w-full rounded-2xl border border-[#d8c8b0] object-cover"
            />
          ) : (
            <div className={`mt-4 h-32 rounded-2xl bg-gradient-to-br ${coverGradient}`} />
          )}
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
