"use client";

import { useEffect, useState } from "react";

interface PostLikeButtonProps {
  postId: string;
  initialLikes: number;
}

export function PostLikeButton({ postId, initialLikes }: PostLikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const storageKey = `sudha-liked-post:${postId}`;

  useEffect(() => {
    try {
      const alreadyLiked = window.localStorage.getItem(storageKey) === "true";
      setLiked(alreadyLiked);
    } catch {
      setLiked(false);
    }
  }, [storageKey]);

  const handleLike = async () => {
    if (liked || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/analytics/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = (await response.json()) as { ok?: boolean; likes?: number };
      if (response.ok && data.ok) {
        setLikes(data.likes ?? likes + 1);
        setLiked(true);
        window.localStorage.setItem(storageKey, "true");
      }
    } catch {
      // ignore like failures quietly
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLike}
      disabled={liked || isSaving}
      className={`inline-flex items-center gap-2 rounded-full border px-5 py-2 font-semibold transition ${
        liked
          ? "border-[#d96b7d] bg-[#fdecef] text-[#b5475d]"
          : "border-[#d7c6ae] bg-[#fff7ee] text-[#724858] hover:bg-[#fbe9ee]"
      } ${isSaving ? "opacity-70" : ""}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill={liked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 21s-6.716-4.35-9.193-8.042C.708 9.846 1.447 5.5 5.548 4.34A5.796 5.796 0 0 1 12 6.08a5.796 5.796 0 0 1 6.452-1.74c4.101 1.16 4.84 5.506 2.741 8.618C18.716 16.65 12 21 12 21Z" />
      </svg>
      <span>{liked ? "Liked" : "Like"}</span>
      <span className="rounded-full bg-white/70 px-2 py-0.5 text-sm">{likes}</span>
    </button>
  );
}
