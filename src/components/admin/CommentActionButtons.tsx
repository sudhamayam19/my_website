"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface CommentActionButtonsProps {
  commentId: string;
  pinned: boolean;
  highlighted: boolean;
}

export function CommentActionButtons({ commentId, pinned, highlighted }: CommentActionButtonsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const patch = async (body: object) => {
    setBusy(true);
    try {
      await fetch(`/api/admin/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => void patch({ pinned: !pinned })}
        className={`rounded-full border px-3 py-1 text-xs font-semibold transition disabled:opacity-60 ${
          pinned
            ? "border-[#2a6670] bg-[#edf7f6] text-[#2a6670]"
            : "border-[#c7b294] text-[#4f5f69] hover:bg-[#f6efe3]"
        }`}
      >
        {pinned ? "📌 Pinned" : "Pin"}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => void patch({ highlighted: !highlighted })}
        className={`rounded-full border px-3 py-1 text-xs font-semibold transition disabled:opacity-60 ${
          highlighted
            ? "border-[#c8a84b] bg-[#fffbec] text-[#a07c1a]"
            : "border-[#c7b294] text-[#4f5f69] hover:bg-[#f6efe3]"
        }`}
      >
        {highlighted ? "★ Featured" : "Feature"}
      </button>
    </>
  );
}
