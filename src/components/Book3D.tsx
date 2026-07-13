"use client";

import { useState } from "react";

interface Book3DProps {
  coverSrc?: string;   // e.g. /books/kriya-yoga-cover.jpg
  title: string;
  author: string;      // shown on spine
}

// Auto-revolving CSS-3D book. Falls back to a styled cover if the image is missing.
export function Book3D({ coverSrc, title, author }: Book3DProps) {
  const [imgOk, setImgOk] = useState(Boolean(coverSrc));

  return (
    <div className="book3d-stage">
      <div className="book3d">
        {/* Front cover */}
        <div className="book3d-face book3d-front">
          {coverSrc && imgOk ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverSrc} alt={title} onError={() => setImgOk(false)} />
          ) : (
            <div className="book3d-fallback">
              <span className="book3d-fallback-title">{title}</span>
              <span className="book3d-fallback-om">ॐ</span>
              <span className="book3d-fallback-author">{author}</span>
            </div>
          )}
        </div>
        {/* Back cover */}
        <div className="book3d-face book3d-back" />
        {/* Spine */}
        <div className="book3d-face book3d-spine"><span>{title}</span></div>
        {/* Right edge (pages) */}
        <div className="book3d-face book3d-pages" />
        {/* Top & bottom */}
        <div className="book3d-face book3d-top" />
        <div className="book3d-face book3d-bottom" />
      </div>

      <style jsx>{`
        .book3d-stage {
          perspective: 1600px;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 40px 0;
        }
        .book3d {
          position: relative;
          width: 220px;
          height: 320px;
          transform-style: preserve-3d;
          animation: book-spin 14s linear infinite;
        }
        .book3d:hover { animation-play-state: paused; }
        .book3d-face {
          position: absolute;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.25);
        }
        .book3d-front, .book3d-back {
          width: 220px; height: 320px;
          border-radius: 3px 6px 6px 3px;
        }
        .book3d-front { transform: translateZ(20px); background: linear-gradient(160deg,#f3ede0,#7a2d1e); }
        .book3d-front img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .book3d-back  { transform: rotateY(180deg) translateZ(20px); background: linear-gradient(200deg,#6a1f14,#3a120b); }
        .book3d-spine {
          width: 40px; height: 320px;
          left: -20px;
          transform: rotateY(-90deg);
          transform-origin: right center;
          background: linear-gradient(#7a2d1e,#4a160d);
          display: flex; align-items: center; justify-content: center;
        }
        .book3d-spine span {
          color: #f3ede0; font-size: 12px; font-weight: 700;
          writing-mode: vertical-rl; transform: rotate(180deg);
          white-space: nowrap; letter-spacing: 1px;
        }
        .book3d-pages {
          width: 40px; height: 320px;
          right: -20px;
          transform: rotateY(90deg);
          transform-origin: left center;
          background: repeating-linear-gradient(to right,#fdfaf2,#fdfaf2 1px,#e6ddc9 2px,#fdfaf2 3px);
        }
        .book3d-top, .book3d-bottom {
          width: 220px; height: 40px;
          background: repeating-linear-gradient(to right,#fdfaf2,#fdfaf2 1px,#e6ddc9 2px,#fdfaf2 3px);
        }
        .book3d-top    { top: 0;    transform: rotateX(90deg) translateZ(20px); }
        .book3d-bottom { bottom: 0; transform: rotateX(-90deg) translateZ(300px); }
        .book3d-fallback {
          width: 100%; height: 100%;
          display: flex; flex-direction: column; align-items: center; justify-content: space-between;
          padding: 26px 16px; text-align: center;
          background: linear-gradient(180deg,#f3ede0 0%,#c86a3a 45%,#7a2d1e 100%);
        }
        .book3d-fallback-title  { font-size: 20px; font-weight: 800; color: #3a120b; line-height: 1.2; }
        .book3d-fallback-om     { font-size: 52px; color: #fff; opacity: 0.9; }
        .book3d-fallback-author { font-size: 12px; font-weight: 700; color: #f3ede0; }
        @keyframes book-spin {
          from { transform: rotateY(0deg)   rotateX(-6deg); }
          to   { transform: rotateY(360deg) rotateX(-6deg); }
        }
        @media (max-width: 640px) {
          .book3d { width: 170px; height: 250px; }
          .book3d-front, .book3d-back { width: 170px; height: 250px; }
          .book3d-spine, .book3d-pages { height: 250px; }
          .book3d-top, .book3d-bottom { width: 170px; }
          .book3d-bottom { transform: rotateX(-90deg) translateZ(230px); }
        }
      `}</style>
    </div>
  );
}
