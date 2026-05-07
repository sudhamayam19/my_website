"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { BlogPost, PodcastEpisode } from "@/lib/site-data";

interface SearchData {
  posts: BlogPost[];
  episodes: PodcastEpisode[];
}

interface SearchModalProps {
  onClose: () => void;
}

export function SearchModal({ onClose }: SearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [data, setData] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    inputRef.current?.focus();
    fetch("/api/search")
      .then((r) => r.json())
      .then((d: SearchData) => setData(d))
      .catch(() => setData({ posts: [], episodes: [] }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const q = query.trim().toLowerCase();

  const filteredPosts = q
    ? (data?.posts ?? []).filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      )
    : [];

  const filteredEpisodes = q
    ? (data?.episodes ?? []).filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.excerpt.toLowerCase().includes(q) ||
          (e.tags ?? []).some((t) => t.toLowerCase().includes(q)),
      )
    : [];

  const allResults = [
    ...filteredPosts.map((p) => ({ type: "post" as const, item: p })),
    ...filteredEpisodes.map((e) => ({ type: "episode" as const, item: e })),
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, allResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      const result = allResults[activeIndex];
      if (result) navigate(result.type, result.item.id);
    }
  };

  const navigate = (type: "post" | "episode", id: string) => {
    router.push(type === "post" ? `/blog/${id}` : `/podcasts/${id}`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-auto mt-16 w-full max-w-2xl rounded-2xl bg-[#fffaf3] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-[#d8c8b0] px-5 py-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[#8fa3ad]">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(-1); }}
            onKeyDown={handleKeyDown}
            placeholder="Search articles and podcasts…"
            className="flex-1 bg-transparent text-base text-[#1f2d39] placeholder-[#8fa3ad] outline-none"
          />
          <button onClick={onClose} className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-[#8fa3ad] hover:text-[#1f2d39]">
            ESC
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <p className="px-5 py-8 text-center text-sm text-[#8fa3ad]">Loading…</p>
          )}

          {!loading && !q && (
            <p className="px-5 py-8 text-center text-sm text-[#8fa3ad]">Start typing to search…</p>
          )}

          {!loading && q && allResults.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-[#8fa3ad]">No results for &ldquo;{query}&rdquo;</p>
          )}

          {!loading && filteredPosts.length > 0 && (
            <div>
              <p className="px-5 pt-4 pb-1 text-[10px] font-black uppercase tracking-widest text-[#2a6670]">Articles</p>
              {filteredPosts.map((post, i) => {
                const globalIdx = i;
                return (
                  <button
                    key={post.id}
                    onClick={() => navigate("post", post.id)}
                    className={`flex w-full items-center gap-4 px-5 py-3 text-left transition-colors ${activeIndex === globalIdx ? "bg-[#e8f4f5]" : "hover:bg-[#f5ede0]"}`}
                  >
                    <div className={`h-10 w-10 shrink-0 rounded-lg ${post.coverImageUrl ? "" : `bg-gradient-to-br ${post.coverGradient}`}`}
                      style={post.coverImageUrl ? { backgroundImage: `url(${post.coverImageUrl})`, backgroundSize: "cover" } : undefined}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-bold text-[#1f2d39]">{post.title}</p>
                      <p className="truncate text-xs text-[#60717b]">{post.category} · {post.excerpt.slice(0, 60)}…</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!loading && filteredEpisodes.length > 0 && (
            <div className="pb-2">
              <p className="px-5 pt-4 pb-1 text-[10px] font-black uppercase tracking-widest text-[#2a6670]">Podcasts</p>
              {filteredEpisodes.map((ep, i) => {
                const globalIdx = filteredPosts.length + i;
                return (
                  <button
                    key={ep.id}
                    onClick={() => navigate("episode", ep.id)}
                    className={`flex w-full items-center gap-4 px-5 py-3 text-left transition-colors ${activeIndex === globalIdx ? "bg-[#e8f4f5]" : "hover:bg-[#f5ede0]"}`}
                  >
                    <div className={`h-10 w-10 shrink-0 rounded-lg ${ep.coverImageUrl ? "" : "bg-gradient-to-br from-[#2f6c76] to-[#d89a55]"}`}
                      style={ep.coverImageUrl ? { backgroundImage: `url(${ep.coverImageUrl})`, backgroundSize: "cover" } : undefined}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-bold text-[#1f2d39]">{ep.title}</p>
                      <p className="truncate text-xs text-[#60717b]">{ep.durationMinutes} min · {ep.excerpt.slice(0, 60)}…</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
