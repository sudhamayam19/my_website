"use client";

import { useEffect, useRef, useState } from "react";

const events = [
  {
    year: "2005",
    title: "Radio Journey Begins",
    description: "Started as an RJ and built a daily connection with listeners through music and storytelling.",
    color: "#2f7e87",
    glow: "rgba(47,126,135,0.4)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.24 6.15C2.51 6.43 2 7.17 2 8v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8c0-.83-.51-1.57-1.24-1.85L12 2 3.24 6.15zM12 4.45l5.26 2.1H6.74L12 4.45zM7 14a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm10-4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm-5-4a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
      </svg>
    ),
  },
  {
    year: "2008",
    title: "Voice Artist",
    description: "Expanded into commercials, narration, and branded voice projects for broadcast and digital media.",
    color: "#bb6a4b",
    glow: "rgba(187,106,75,0.4)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zm6.364 8.682a1 1 0 0 0-1.978.308A4.49 4.49 0 0 1 12 14.5a4.49 4.49 0 0 1-4.386-4.51 1 1 0 0 0-1.978-.308A6.5 6.5 0 0 0 11 15.93V19H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-3.07a6.5 6.5 0 0 0 5.364-6.248z"/>
      </svg>
    ),
  },
  {
    year: "2012",
    title: "Translation Work",
    description: "Began professional translation projects to bridge language and culture for wider audiences.",
    color: "#a5894d",
    glow: "rgba(165,137,77,0.4)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="m12.87 15.07-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7 1.62-4.33L19.12 17h-3.24z"/>
      </svg>
    ),
  },
  {
    year: "2020",
    title: "Podcast Launch",
    description: "Launched long-format audio storytelling with interviews and personal reflections.",
    color: "#366779",
    glow: "rgba(54,103,121,0.4)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0 8a5 5 0 0 0-5 5v3h2v-3a3 3 0 0 1 6 0v3h2v-3a5 5 0 0 0-5-5zm-1 9v5h2v-5h-2z"/>
      </svg>
    ),
  },
  {
    year: "TODAY",
    title: "Building Across Platforms",
    description: "Publishing blogs, audio, and videos while growing a content-driven personal brand.",
    color: "#c07a2e",
    glow: "rgba(192,122,46,0.4)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
      </svg>
    ),
  },
];

function TimelineItem({ event, index }: { event: typeof events[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const isLeft = index % 2 === 0;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="relative flex items-center"
      style={{
        justifyContent: isLeft ? "flex-start" : "flex-end",
        transition: `opacity 0.6s ease ${index * 0.15}s, transform 0.6s ease ${index * 0.15}s`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : `translateX(${isLeft ? "-40px" : "40px"})`,
      }}
    >
      {/* Card */}
      <div
        className="w-[44%] rounded-2xl p-5 shadow-lg"
        style={{
          background: "#fffaf3",
          border: `2px solid ${event.color}`,
          boxShadow: visible ? `0 8px 32px ${event.glow}` : "none",
          transition: `box-shadow 0.6s ease ${index * 0.15 + 0.3}s`,
        }}
      >
        <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: event.color }}>
          {event.year}
        </p>
        <h3 className="display-font mt-1 text-xl font-bold text-[#1f2d39]">{event.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[#4f5f69]">{event.description}</p>
      </div>

      {/* Center dot — positioned absolutely on the vertical line */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-10 flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${event.color}, ${event.color}cc)`,
          boxShadow: visible ? `0 0 0 6px ${event.glow}, 0 0 20px ${event.glow}` : "none",
          transition: `box-shadow 0.5s ease ${index * 0.15 + 0.2}s`,
        }}
      >
        {event.icon}
      </div>
    </div>
  );
}

export function CareerTimeline() {
  return (
    <section id="journey" className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2a6670]">Career Timeline</p>
        <h2 className="display-font mt-2 text-4xl font-bold text-[#1f2d39] sm:text-5xl mb-12">
          A voice career in milestones
        </h2>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-gradient-to-b from-[#2f7e87] via-[#a5894d] to-[#c07a2e]" />

          <div className="flex flex-col gap-10">
            {events.map((event, i) => (
              <TimelineItem key={event.year} event={event} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
