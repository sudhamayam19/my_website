"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, type ChangeEvent, type FormEvent } from "react";
import { Upload, Music, Image, CheckCircle2, Loader2 } from "lucide-react";
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
  const coverInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const inputClassName =
    "w-full rounded-2xl border border-[#d8c8b0] bg-[#fff9ef] px-4 py-3 text-sm text-[#1f2d39] outline-none transition focus:border-[#2a6670] focus:ring-2 focus:ring-[#c9e3e0]";
  const [form, setForm] = useState<PodcastFormState>(buildInitialState(initialEpisode));
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savedEpisodeId, setSavedEpisodeId] = useState(initialEpisode?.id ?? "");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastFeedback, setBroadcastFeedback] = useState("");

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

      const episodeId = data.episode?.id ?? initialEpisode?.id ?? "";
      setSavedEpisodeId(episodeId);
      setBroadcastFeedback("");
      setSuccess(mode === "edit" ? "Episode updated." : "Episode created.");
      if (mode === "create") { router.push("/admin"); }
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

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-3">
            <span className="text-sm font-semibold text-[#2f3f4e]">Cover image</span>
            <div
              className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-all ${
                isUploadingCover
                  ? "border-[#2a6670] bg-[#edf7f6]"
                  : form.coverImageUrl
                    ? "border-[#b7d2cf] bg-[#f8fcfb]"
                    : "border-[#d8c8b0] bg-[#fffcf5] hover:border-[#b89772] hover:bg-[#fbf4e7]"
              }`}
            >
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => void handleAssetUpload(event, "coverImageUrl")}
              />
              {isUploadingCover ? (
                <div className="flex flex-col items-center space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin text-[#2a6670]" />
                  <span className="text-sm font-medium text-[#2a6670]">Uploading...</span>
                </div>
              ) : form.coverImageUrl ? (
                <div className="flex flex-col items-center space-y-2 text-center">
                  <div className="relative">
                    <CheckCircle2 className="h-8 w-8 text-[#2a6670]" />
                    <div className="absolute inset-0 animate-ping rounded-full bg-[#2a6670] opacity-20" />
                  </div>
                  <span className="text-sm font-medium text-[#2a6670]">Cover uploaded</span>
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="mt-1 text-xs font-semibold text-[#4e4231] underline underline-offset-4 hover:text-[#2a6670]"
                  >
                    Change image
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="group flex flex-col items-center space-y-2 text-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#b89772] shadow-sm transition group-hover:scale-110 group-hover:bg-[#2a6670] group-hover:text-white">
                    <Image className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-[#1f2d39]">Choose image</span>
                    <span className="text-xs text-[#60717b]">PNG, JPG, or WEBP</span>
                  </div>
                </button>
              )}
            </div>
            <input className={inputClassName} value={form.coverImageUrl} placeholder="Or paste a cover image URL" onChange={(event) => updateField("coverImageUrl", event.target.value)} />
            <p className="text-xs text-[#60717b]">Use square or wide artwork for best results.</p>
          </div>

          <div className="space-y-3">
            <span className="text-sm font-semibold text-[#2f3f4e]">Episode audio</span>
            <div
              className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition-all ${
                isUploadingAudio
                  ? "border-[#2a6670] bg-[#edf7f6]"
                  : form.audioUrl
                    ? "border-[#b7d2cf] bg-[#f8fcfb]"
                    : "border-[#d8c8b0] bg-[#fffcf5] hover:border-[#b89772] hover:bg-[#fbf4e7]"
              }`}
            >
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(event) => void handleAssetUpload(event, "audioUrl")}
              />
              {isUploadingAudio ? (
                <div className="flex flex-col items-center space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin text-[#2a6670]" />
                  <span className="text-sm font-medium text-[#2a6670]">Uploading audio...</span>
                </div>
              ) : form.audioUrl ? (
                <div className="flex flex-col items-center space-y-2 text-center">
                  <div className="relative">
                    <Music className="h-8 w-8 text-[#2a6670]" />
                    <div className="absolute inset-x-[-4px] inset-y-[-4px] animate-pulse rounded-full border border-[#2a6670] opacity-40" />
                  </div>
                  <span className="text-sm font-medium text-[#2a6670]">Audio ready</span>
                  <button
                    type="button"
                    onClick={() => audioInputRef.current?.click()}
                    className="mt-1 text-xs font-semibold text-[#4e4231] underline underline-offset-4 hover:text-[#2a6670]"
                  >
                    Replace audio
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => audioInputRef.current?.click()}
                  className="group flex flex-col items-center space-y-2 text-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#b89772] shadow-sm transition group-hover:scale-110 group-hover:bg-[#2a6670] group-hover:text-white">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-[#1f2d39]">Choose audio</span>
                    <span className="text-xs text-[#60717b]">MP3 or M4A format</span>
                  </div>
                </button>
              )}
            </div>
            <input className={inputClassName} value={form.audioUrl} placeholder="Or paste an audio URL" onChange={(event) => updateField("audioUrl", event.target.value)} />
            <p className="text-xs text-[#60717b]">MP3 or M4A works well for a clean listening page.</p>
          </div>
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
          {form.status === "published" && savedEpisodeId && (
            <button
              type="button"
              disabled={isBroadcasting}
              onClick={async () => {
                setIsBroadcasting(true);
                setBroadcastFeedback("");
                try {
                  const link = `https://sudhamayam.vercel.app/podcasts/${savedEpisodeId}`;
                  const res = await fetch("/api/newsletter/broadcast", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title: form.title, excerpt: form.excerpt, link, type: "podcast" }),
                  });
                  const data = (await res.json()) as { sent?: number; error?: string };
                  if (!res.ok) throw new Error(data.error ?? "Broadcast failed");
                  setBroadcastFeedback(`Sent to ${data.sent} subscriber${data.sent === 1 ? "" : "s"} ✓`);
                } catch (e) {
                  setBroadcastFeedback(e instanceof Error ? e.message : "Failed");
                } finally {
                  setIsBroadcasting(false);
                }
              }}
              className="rounded-full border border-[#1f6973] px-6 py-3 text-sm font-semibold text-[#1f6973] transition hover:bg-[#1f6973] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBroadcasting ? "Sending..." : "Notify Subscribers"}
            </button>
          )}
          <button type="button" onClick={() => router.push("/admin")} className="editorial-btn-secondary">
            Cancel
          </button>
        </div>
        {broadcastFeedback ? (
          <p className="text-sm font-medium text-emerald-600">{broadcastFeedback}</p>
        ) : null}
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
