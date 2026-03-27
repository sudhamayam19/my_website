"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { INVALID_COMMENT_ID_MESSAGE, isLikelyPersistentCommentId } from "@/lib/comment-ids";

interface DeleteCommentButtonProps {
  commentId: string;
  author: string;
}

export function DeleteCommentButton({ commentId, author }: DeleteCommentButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!isLikelyPersistentCommentId(commentId)) {
      window.alert(INVALID_COMMENT_ID_MESSAGE);
      return;
    }

    const confirmed = window.confirm(`Delete comment from "${author}"?`);
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { error?: string } | undefined;
      if (!response.ok) {
        throw new Error(data?.error || "Unable to delete comment.");
      }

      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to delete comment.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="rounded-full border border-[#c98e83] px-3 py-1 text-xs font-semibold text-[#9a4335] transition hover:bg-[#f8e7e3] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
}
