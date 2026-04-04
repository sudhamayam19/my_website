"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDisplayDate, type BlogPost } from "@/lib/site-data";

export function BlogSearch({
  posts,
  categories,
}: {
  posts: BlogPost[];
  categories: string[];
}) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = posts.filter((post) => {
    const matchesCategory =
      activeCategory === "All" || post.category === activeCategory;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      post.title.toLowerCase().includes(q) ||
      post.excerpt.toLowerCase().includes(q) ||
      post.category.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  return (
    <>
      {/* Search bar */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts..."
          className="flex-1 rounded-full border border-[#d5c3ab] bg-[#fcf6eb] px-4 py-2 text-sm text-[#1f2d39] placeholder-[#8a9da4] outline-none focus:border-[#2a6670] focus:ring-1 focus:ring-[#2a6670]"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-xs font-semibold text-[#5f6f79] hover:text-[#2a6670]"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category filters */}
      <div className="mt-4 flex flex-wrap gap-2">
        {["All", ...categories].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              activeCategory === cat
                ? "bg-[#1f6973] text-white"
                : "bg-[#eee4d4] text-[#4f5f69] hover:bg-[#ddd0be]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      {(query || activeCategory !== "All") && (
        <p className="mt-3 text-xs text-[#5f6f79]">
          {filtered.length} {filtered.length === 1 ? "post" : "posts"} found
        </p>
      )}

      {/* Posts grid */}
      <div className="mt-6">
        {filtered.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((post) => (
              <article
                key={post.id}
                className="editorial-card overflow-hidden transition hover:-translate-y-1"
              >
                <div
                  className={`h-44 ${post.coverImageUrl ? "" : `bg-gradient-to-br ${post.coverGradient}`}`}
                  style={
                    post.coverImageUrl
                      ? {
                          backgroundImage: `url(${post.coverImageUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : undefined
                  }
                />
                <div className="p-6">
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                    <span className="editorial-chip">{post.category}</span>
                    <span className="text-[#5f6f79]">{formatDisplayDate(post.publishedAt)}</span>
                    <span className="text-[#5f6f79]">{post.readTimeMinutes} min read</span>
                  </div>
                  <h2 className="display-font text-3xl font-bold text-[#1f2d39]">{post.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-[#4f5f69]">{post.excerpt}</p>
                  <Link href={`/blog/${post.id}`} className="editorial-btn-secondary mt-5">
                    Read post
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-[#c8b397] bg-[#fff9ef] px-6 py-10 text-[#50616d]">
            No posts match your search.
          </p>
        )}
      </div>
    </>
  );
}
