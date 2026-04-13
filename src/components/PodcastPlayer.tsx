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

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function PodcastPlayer({ episodeId, audioUrl }: PodcastPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [tracked, setTracked] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [liked, setLiked] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);
  const speedRef = useRef<HTMLDivElement>(null);

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

  // Close speed dropdown on outside click
  useEffect(() => {
    if (!speedOpen) return;
    const handler = (e: MouseEvent) => {
      if (speedRef.current && !speedRef.current.contains(e.target as Node)) {
        setSpeedOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [speedOpen]);

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
    setSpeedOpen(false);
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

        {/* Like button */}
        <button
          onClick={() => setLiked((v) => !v)}
          className="group flex flex-col items-center gap-0.5"
          title={liked ? "Unlike" : "Like"}
        >
          <svg
            width="22" height="22" viewBox="0 0 24 24"
            fill={liked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-all duration-200 ${
              liked
                ? "text-[#ff4d6d] scale-110"
                : "text-white/50 group-hover:text-white/80 group-hover:scale-110"
            }`}
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span className={`text-[10px] font-semibold tabular-nums transition-colors ${liked ? "text-[#ff4d6d]" : "text-white/40"}`}>
            {liked ? "Liked" : "Like"}
          </span>
        </button>

        {/* Play controls */}
        <div className="flex items-center gap-6">
          {/* Skip back 15s */}
          <button onClick={() => skip(-15)} className="flex flex-col items-center gap-0.5 text-white/60 hover:text-white transition group" title="Back 15s">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
              <text x="7.4" y="15.5" fontSize="5" fontFamily="sans-serif" fontWeight="bold" fill="currentColor">15</text>
            </svg>
            <span className="text-[10px] font-semibold">-15s</span>
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
          <button onClick={() => skip(15)} className="flex flex-col items-center gap-0.5 text-white/60 hover:text-white transition group" title="Forward 15s">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
              <text x="7.4" y="15.5" fontSize="5" fontFamily="sans-serif" fontWeight="bold" fill="currentColor">15</text>
            </svg>
            <span className="text-[10px] font-semibold">+15s</span>
          </button>
        </div>

        {/* Speed dropdown */}
        <div ref={speedRef} className="relative flex flex-col items-center gap-0.5">
          <button
            onClick={() => setSpeedOpen((v) => !v)}
            className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition"
            title="Playback speed"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="opacity-70">
              <path d="M10 8v8l6-4-6-4zm6.67-1.19l-1.45 1.45C16.23 9.48 17 10.66 17 12c0 1.34-.77 2.52-1.78 3.19l1.45 1.45C18.09 15.45 19 13.82 19 12s-.91-3.45-2.33-4.19zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            </svg>
            {speed}×
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className={`opacity-60 transition-transform ${speedOpen ? "rotate-180" : ""}`}>
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </button>
          <span className="text-[10px] font-semibold text-white/40">Speed</span>

          {speedOpen && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 overflow-hidden rounded-xl border border-white/15 bg-[#0f1e26]/95 backdrop-blur-sm shadow-xl">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeedVal(s)}
                  className={`flex w-full items-center justify-between gap-6 px-4 py-2.5 text-xs font-bold transition ${
                    speed === s
                      ? "bg-white/15 text-white"
                      : "text-white/55 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span>{s}×</span>
                  {speed === s && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
