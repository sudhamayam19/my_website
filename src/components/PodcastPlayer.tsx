"use client";

import { useEffect, useRef, useState } from "react";

interface PodcastPlayerProps {
  episodeId: string;
  audioUrl: string;
}

function fmt(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export function PodcastPlayer({ episodeId, audioUrl }: PodcastPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [tracked, setTracked] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => { if (!dragging) setCurrent(a.currentTime); };
    const onDur  = () => setDuration(a.duration);
    const onEnd  = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onDur);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onDur);
      a.removeEventListener("ended", onEnd);
    };
  }, [dragging]);

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else {
      await a.play();
      setPlaying(true);
      if (!tracked) {
        setTracked(true);
        fetch("/api/analytics/podcast-listen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: episodeId }),
        }).catch(() => null);
      }
    }
  };

  const skip = (sec: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(a.currentTime + sec, duration));
  };

  const setSpeedVal = (s: number) => {
    const a = audioRef.current;
    if (a) a.playbackRate = s;
    setSpeed(s);
  };

  const pct = duration > 0 ? (current / duration) * 100 : 0;

  const seek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const bar = e.currentTarget.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - bar.left) / bar.width));
    const newTime = ratio * duration;
    setCurrent(newTime);
    if (audioRef.current) audioRef.current.currentTime = newTime;
  };

  return (
    <div className="select-none">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Progress bar */}
      <div
        className="group relative h-1.5 cursor-pointer rounded-full bg-white/20 hover:h-2.5 transition-all duration-150"
        onClick={seek}
        onMouseDown={() => setDragging(true)}
        onMouseUp={() => setDragging(false)}
        onTouchStart={() => setDragging(true)}
        onTouchEnd={(e) => { seek(e); setDragging(false); }}
        onTouchMove={seek}
      >
        <div
          className="h-full rounded-full bg-white transition-all"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white shadow opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${pct}% - 8px)` }}
        />
      </div>

      {/* Time */}
      <div className="mt-2 flex justify-between text-xs text-white/50 font-medium tabular-nums">
        <span>{fmt(current)}</span>
        <span>{fmt(duration)}</span>
      </div>

      {/* Controls */}
      <div className="mt-5 flex items-center justify-between">
        {/* Speed */}
        <div className="flex gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeedVal(s)}
              className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${
                speed === s
                  ? "bg-white text-[#1f2d39]"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>

        {/* Play controls */}
        <div className="flex items-center gap-5">
          {/* Skip back 15s */}
          <button onClick={() => skip(-15)} className="text-white/70 hover:text-white transition" title="Back 15s">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
              <text x="7.5" y="15.5" fontSize="5.5" fontFamily="sans-serif" fontWeight="bold" fill="currentColor">15</text>
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            onClick={() => void toggle()}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#1f2d39] shadow-lg hover:scale-105 active:scale-95 transition-transform"
          >
            {playing ? (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1"/>
                <rect x="14" y="4" width="4" height="16" rx="1"/>
              </svg>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          {/* Skip forward 15s */}
          <button onClick={() => skip(15)} className="text-white/70 hover:text-white transition" title="Forward 15s">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
              <text x="7.5" y="15.5" fontSize="5.5" fontFamily="sans-serif" fontWeight="bold" fill="currentColor">15</text>
            </svg>
          </button>
        </div>

        {/* Spacer to balance layout */}
        <div className="w-[88px]" />
      </div>
    </div>
  );
}
