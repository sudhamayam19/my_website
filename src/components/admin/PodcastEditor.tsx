"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import type { PodcastEpisode } from "@/lib/site-data";

interface PodcastEditorProps {
  mode: "create" | "edit";
  initialEpisode?: PodcastEpisode;
}

interface PodcastFormState {
  title: string;
  excerpt: string;
  description: string;
  showTitle: string;
  publishedAt: string;
  durationMinutes: string;
  audioUrl: string;
  coverImageUrl: string;
  status: "draft" | "published";
  featured: boolean;
  seoDescription: string;
}

function buildInitialState(episode?: PodcastEpisode): PodcastFormState {
  return {
    title: episode?.title ?? "",
    excerpt: episode?.excerpt ?? "",
    description: episode?.description ?? "",
    showTitle: episode?.showTitle ?? "Sudha Devarakonda Podcast",
    publishedAt: episode?.publishedAt ?? new Date().toISOString().slice(0, 10),
    durationMinutes: String(episode?.durationMinutes ?? 20),
    audioUrl: episode?.audioUrl ?? "",
    coverImageUrl: episode?.coverImageUrl ?? "",
    status: episode?.status ?? "draft",
    featured: episode?.featured ?? false,
    seoDescription: episode?.seoDescription ?? episode?.excerpt ?? "",
  };
}

async function uploadAsset(file: File) {
  // 1. Get the upload URL from the server (checking auth)
  const prepareResponse = await fetch("/api/admin/uploads?action=prepare");
  const { uploadUrl, error: prepareError } = (await prepareResponse.json()) as {
    uploadUrl?: string;
    error?: string;
  };
  if (!prepareResponse.ok || !uploadUrl) {
    throw new Error(prepareError || "Failed to prepare upload.");
  }

  // 2. POST the file directly to Convex (bypassing Vercel's 4.5MB limit)
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("Direct upload to Convex failed.");
  }

  const { storageId } = (await uploadResponse.json()) as { storageId?: string };
  if (!storageId) {
    throw new Error("Upload succeeded but no storage ID was returned.");
  }

  // 3. Resolve the storageId to a public URL
  const resolveResponse = await fetch(`/api/admin/uploads?action=resolve&storageId=${storageId}`);
  const { url, error: resolveError } = (await resolveResponse.json()) as {
    url?: string;
    error?: string;
  };
  if (!resolveResponse.ok || !url) {
    throw new Error(resolveError || "Failed to resolve file URL.");
  }

  return url;
}

export function PodcastEditor({ mode, initialEpisode }: PodcastEditorProps) {
  const router = useRouter();
  const inputClassName =
    "w-full rounded-2xl border border-[#d8c8b0] bg-[#fff9ef] px-4 py-3 text-sm text-[#1f2d39] outline-none transition focus:border-[#2a6670] focus:ring-2 focus:ring-[#c9e3e0]";
  const [form, setForm] = useState<PodcastFormState>(buildInitialState(initialEpisode));
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function updateField<K extends keyof PodcastFormState>(field: K, value: PodcastFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleAssetUpload(
    event: ChangeEvent<HTMLInputElement>,
    field: "coverImageUrl" | "audioUrl",
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setError("");
    setSuccess("");
    const setUploading = field === "coverImageUrl" ? setIsUploadingCover : setIsUploadingAudio;
    setUploading(true);

    try {
      const url = await uploadAsset(file);
      updateField(field, url);
      setSuccess(field === "audioUrl" ? "Audio uploaded." : "Cover uploaded.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        title: form.title,
        excerpt: form.excerpt,
        description: form.description,
        showTitle: form.showTitle,
        publishedAt: form.publishedAt,
        durationMinutes: Number(form.durationMinutes) || 20,
        audioUrl: form.audioUrl,
        coverImageUrl: form.coverImageUrl || undefined,
        status: form.status,
        featured: form.featured,
        seoDescription: form.seoDescription || form.excerpt,
      };

      const endpoint =
        mode === "edit" && initialEpisode
          ? `/api/admin/podcasts/${initialEpisode.id}`
          : "/api/admin/podcasts";
      const response = await fetch(endpoint, {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { episode?: { id: string }; error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Unable to save episode.");
      }

      setSuccess(mode === "edit" ? "Episode updated." : "Episode created.");
      router.push("/admin");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save episode.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <form onSubmit={handleSubmit} className="editorial-card space-y-6 p-6 sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2a6670]">
            Podcast Studio
          </p>
          <h1 className="display-font mt-3 text-4xl font-bold text-[#1f2d39] sm:text-5xl">
            {mode === "edit" ? "Edit episode" : "Create episode"}
          </h1>
          <p className="mt-3 max-w-2xl text-[#4f5f69]">
            Upload audio, add a strong summary, and publish a clean listening page for visitors.
          </p>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[#2f3f4e]">Episode title</span>
          <input className={inputClassName} value={form.title} onChange={(event) => updateField("title", event.target.value)} />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[#2f3f4e]">Short excerpt</span>
          <textarea className={`${inputClassName} min-h-24`} value={form.excerpt} onChange={(event) => updateField("excerpt", event.target.value)} />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[#2f3f4e]">Full description</span>
          <textarea className={`${inputClassName} min-h-40`} value={form.description} onChange={(event) => updateField("description", event.target.value)} />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#2f3f4e]">Show title</span>
            <input className={inputClassName} value={form.showTitle} onChange={(event) => updateField("showTitle", event.target.value)} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#2f3f4e]">Publish date</span>
            <input type="date" className={inputClassName} value={form.publishedAt} onChange={(event) => updateField("publishedAt", event.target.value)} />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#2f3f4e]">Duration in minutes</span>
            <input type="number" min={1} max={600} className={inputClassName} value={form.durationMinutes} onChange={(event) => updateField("durationMinutes", event.target.value)} />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#2f3f4e]">SEO description</span>
            <input className={inputClassName} value={form.seoDescription} onChange={(event) => updateField("seoDescription", event.target.value)} />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#2f3f4e]">Cover image</span>
            <input
              type="file"
              accept="image/*"
              className="block w-full text-sm text-[#445963]"
              onChange={(event) => void handleAssetUpload(event, "coverImageUrl")}
            />
            <input className={inputClassName} value={form.coverImageUrl} placeholder="Or paste a cover image URL" onChange={(event) => updateField("coverImageUrl", event.target.value)} />
            <p className="text-xs text-[#60717b]">{isUploadingCover ? "Uploading cover..." : "Use square or wide artwork for best results."}</p>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#2f3f4e]">Episode audio</span>
            <input
              type="file"
              accept="audio/*"
              className="block w-full text-sm text-[#445963]"
              onChange={(event) => void handleAssetUpload(event, "audioUrl")}
            />
            <input className={inputClassName} value={form.audioUrl} placeholder="Or paste an audio URL" onChange={(event) => updateField("audioUrl", event.target.value)} />
            <p className="text-xs text-[#60717b]">{isUploadingAudio ? "Uploading audio..." : "MP3 or M4A works well for a clean listening page."}</p>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#2f3f4e]">Status</span>
            <select className={inputClassName} value={form.status} onChange={(event) => updateField("status", event.target.value as "draft" | "published")}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-[#d8c8b0] bg-[#fbf4e7] px-4 py-3 text-sm font-semibold text-[#2f3f4e]">
            <input type="checkbox" checked={form.featured} onChange={(event) => updateField("featured", event.target.checked)} />
            Feature this episode
          </label>
        </div>

        {error ? (
          <p className="rounded-2xl border border-[#d29c8f] bg-[#fbe9e4] px-4 py-3 text-sm text-[#8b4034]">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-2xl border border-[#b7d2cf] bg-[#edf7f6] px-4 py-3 text-sm text-[#245b61]">
            {success}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={isSaving || isUploadingAudio || isUploadingCover} className="editorial-btn-primary disabled:cursor-not-allowed disabled:opacity-60">
            {isSaving ? "Saving..." : mode === "edit" ? "Save episode" : "Create episode"}
          </button>
          <button type="button" onClick={() => router.push("/admin")} className="editorial-btn-secondary">
            Cancel
          </button>
        </div>
      </form>

      <aside className="editorial-card space-y-5 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2a6670]">
          Listener Preview
        </p>
        <div className="overflow-hidden rounded-[2rem] border border-[#d8c8b0] bg-[#fff9ef]">
          <div
            className={`h-52 ${form.coverImageUrl ? "" : "bg-gradient-to-br from-[#1f6a6d] to-[#4ea59e]"}`}
            style={
              form.coverImageUrl
                ? {
                    backgroundImage: `url(${form.coverImageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          />
          <div className="space-y-4 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#60717b]">
              {form.showTitle || "Sudha Devarakonda Podcast"}
            </p>
            <h2 className="display-font text-3xl font-bold text-[#1f2d39]">
              {form.title || "Episode title"}
            </h2>
            <p className="text-sm leading-relaxed text-[#4f5f69]">
              {form.excerpt || "A short listener-facing summary will appear here."}
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-[#60717b]">
              <span className="rounded-full bg-[#f1e6d5] px-3 py-1">{form.status}</span>
              <span className="rounded-full bg-[#f1e6d5] px-3 py-1">{form.durationMinutes || "20"} min</span>
              {form.featured ? <span className="rounded-full bg-[#dfeeed] px-3 py-1 text-[#1f6973]">Featured</span> : null}
            </div>
            {form.audioUrl ? (
              <audio controls className="w-full">
                <source src={form.audioUrl} />
              </audio>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#d8c8b0] px-4 py-5 text-sm text-[#60717b]">
                Upload audio to preview the player.
              </div>
            )}
            <p className="text-sm leading-relaxed text-[#4f5f69]">
              {form.description || "A fuller episode description helps listeners decide what to play."}
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
