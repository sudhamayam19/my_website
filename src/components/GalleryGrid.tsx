"use client";

import { useState } from "react";

interface Photo {
  src: string;
  caption?: string;
  category?: string;
}

export function GalleryGrid({ photos }: { photos: Photo[] }) {
  const [selected, setSelected] = useState<Photo | null>(null);

  if (photos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#d8c8b0] bg-[#fffaf3] px-6 py-24 text-center">
        <div className="text-5xl mb-4">📸</div>
        <p className="font-semibold text-[#1f2d39] text-lg">Photos coming soon</p>
        <p className="text-sm text-[#60717b] mt-2">A visual journey through 20 years of voice, radio, and storytelling.</p>
      </div>
    );
  }

  return (
    <>
      {/* Masonry grid */}
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
        {photos.map((photo, i) => (
          <div
            key={i}
            onClick={() => setSelected(photo)}
            className="break-inside-avoid cursor-pointer overflow-hidden rounded-2xl border border-[#d8c8b0] bg-[#fffaf3] group relative"
          >
            <img
              src={photo.src}
              alt={photo.caption ?? ""}
              className="w-full object-cover transition duration-300 group-hover:scale-105"
            />
            {photo.caption && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
                <p className="text-white text-xs font-semibold leading-snug">{photo.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelected(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={selected.src} alt={selected.caption ?? ""} className="w-full rounded-2xl shadow-2xl" />
            {selected.caption && (
              <p className="mt-3 text-center text-white/80 text-sm">{selected.caption}</p>
            )}
            <button
              onClick={() => setSelected(null)}
              className="absolute -top-3 -right-3 h-9 w-9 rounded-full bg-white text-[#1f2d39] font-bold text-lg flex items-center justify-center shadow-lg hover:scale-110 transition"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
