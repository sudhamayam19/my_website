"use client";

import { useRef, useState } from "react";

// Uploads to Convex storage and returns the public URL.
export function PhotoPicker({
  value,
  onChange,
  label = "Photo (optional)",
}: {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const urlRes = await fetch("/api/admin/upload-url", { method: "POST", credentials: "same-origin" });
      const { uploadUrl, error } = (await urlRes.json()) as { uploadUrl?: string; error?: string };
      if (!uploadUrl) throw new Error(error ?? "Could not get upload URL");

      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = (await uploadRes.json()) as { storageId: string };

      const urlRes2 = await fetch(`/api/admin/storage-url?id=${storageId}`, { credentials: "same-origin" });
      const { url } = (await urlRes2.json()) as { url: string };
      onChange(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-bold uppercase tracking-wider text-[#2a6670]">{label}</span>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault(); setDrag(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void upload(file);
        }}
        onClick={() => inputRef.current?.click()}
        className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center transition
          ${drag ? "border-[#2a6670] bg-[#f0f8f8]" : "border-[#d3c1a8] bg-white hover:border-[#2a6670]"}`}
      >
        {uploading ? (
          <p className="text-xs text-[#8fa3ad]">Uploading…</p>
        ) : value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="preview" className="max-h-32 rounded-lg object-cover border border-[#d3c1a8]" />
            <p className="text-[11px] text-[#8fa3ad]">Tap to change</p>
          </>
        ) : (
          <>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8fa3ad" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="text-xs text-[#8fa3ad]">Tap or drag &amp; drop a photo</p>
          </>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
      </div>
      {value && (
        <button type="button" onClick={() => onChange("")}
          className="text-[11px] text-[#c08080] hover:underline">
          Remove photo
        </button>
      )}
    </div>
  );
}
