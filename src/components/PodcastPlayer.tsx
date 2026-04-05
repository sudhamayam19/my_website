"use client";

import { useState } from "react";

interface PodcastPlayerProps {
  episodeId: string;
  audioUrl: string;
}

export function PodcastPlayer({ episodeId, audioUrl }: PodcastPlayerProps) {
  const [tracked, setTracked] = useState(false);

  async function handlePlay() {
    if (tracked) {
      return;
    }

    setTracked(true);
    try {
      await fetch("/api/analytics/podcast-listen", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: episodeId }),
      });
    } catch {
      // ignore listen tracking failures
    }
  }

  return (
    <audio controls className="w-full" onPlay={() => void handlePlay()}>
      <source src={audioUrl} />
    </audio>
  );
}
