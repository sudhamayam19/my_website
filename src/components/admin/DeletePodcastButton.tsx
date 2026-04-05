"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeletePodcastButtonProps {
  episodeId: string;
  episodeTitle: string;
}

export function DeletePodcastButton({
  episodeId,
  episodeTitle,
}: DeletePodcastButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(`Delete "${episodeTitle}"?`);
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/podcasts/${episodeId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to delete episode.");
      }
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to delete episode.";
      window.alert(message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="rounded-full border border-[#b76555] px-3 py-1 text-xs font-semibold text-[#8f3f34] transition hover:bg-[#fbebe5] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
}
