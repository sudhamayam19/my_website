"use client";

import { useEffect, useState } from "react";

type Dose = { text: string; author?: string; style: "scroll" | "flash" };

const ROTATE_MS = 7000;

export function RotatingDose({ doses }: { doses: Dose[] }) {
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (doses.length <= 1) return;
    const id = setInterval(() => {
      setVisible(false); // fade out
      setTimeout(() => {
        setI((prev) => (prev + 1) % doses.length);
        setVisible(true); // fade in next
      }, 400);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [doses.length]);

  if (doses.length === 0) return null;
  const dose = doses[i];
  const body = dose.author ? `${dose.text} — ${dose.author}` : dose.text;

  return (
    <div className="daily-dose-wrap">
      <div
        style={{ opacity: visible ? 1 : 0, transition: "opacity 0.4s ease" }}
      >
        {dose.style === "flash" ? (
          <div className="daily-dose-flash">
            <span className="daily-dose-badge">Daily Dose</span>
            <p className="daily-dose-copy">{body}</p>
          </div>
        ) : (
          <div className="daily-dose-marquee" aria-label="Daily Dose">
            <div className="daily-dose-track">
              <span className="daily-dose-badge">Daily Dose</span>
              <span className="daily-dose-copy">{body}</span>
              <span className="daily-dose-sep">•</span>
              <span className="daily-dose-badge">Daily Dose</span>
              <span className="daily-dose-copy">{body}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
