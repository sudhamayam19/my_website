import type { Metadata } from "next";
import Link from "next/link";
import { getHomeNav } from "@/components/AuthNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getMediaAppearances } from "@/lib/content-store";
import { SITE_NAME } from "@/lib/site-data";

export const metadata: Metadata = {
  title: `Media & Press | ${SITE_NAME}`,
  description: "Sudha Devarakonda's media appearances — TV, radio, print, podcasts and events.",
};

const CATEGORY_LABELS: Record<string, string> = {
  tv: "TV",
  radio: "Radio",
  print: "Print",
  online: "Online",
  podcast: "Podcast",
  event: "Event",
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  tv:      { bg: "#eef4fb", text: "#2a4f76", border: "#b8d0ea" },
  radio:   { bg: "#f0fff4", text: "#1a5c38", border: "#a8dbb8" },
  print:   { bg: "#fdf4e7", text: "#7a4b10", border: "#e8c88a" },
  online:  { bg: "#f3eefb", text: "#5a2d82", border: "#c8aae8" },
  podcast: { bg: "#f0f8f8", text: "#1f6973", border: "#a8d4d8" },
  event:   { bg: "#fff0f5", text: "#8b1a4a", border: "#e8a8c0" },
};

const CATEGORY_ICONS: Record<string, JSX.Element> = {
  tv: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/></svg>,
  radio: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3.24 6.15C2.51 6.43 2 7.17 2 8v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8c0-.83-.51-1.57-1.24-1.85L12 2 3.24 6.15zM7 17a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm10-7H7V8h10v2z"/></svg>,
  print: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v4H1v8h2v4h18v-4h2v-8h-2V5c0-1.1-.9-2-2-2zm0 16H5v-4h14v4zm2-6H3v-4h18v4zM5 5h14v4H5V5z"/></svg>,
  online: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>,
  podcast: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zm6.364 8.682a1 1 0 0 0-1.978.308A4.49 4.49 0 0 1 12 14.5a4.49 4.49 0 0 1-4.386-4.51 1 1 0 0 0-1.978-.308A6.5 6.5 0 0 0 11 15.93V19H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-3.07a6.5 6.5 0 0 0 5.364-6.248z"/></svg>,
  event: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>,
};

export default async function MediaPage() {
  const [navItems, items] = await Promise.all([
    getHomeNav({ includeJourney: true, includeMedia: true }),
    getMediaAppearances(),
  ]);

  const featured = items.filter((i) => i.featured);
  const rest = items.filter((i) => !i.featured);

  return (
    <div className="page-shell">
      <SiteHeader navItems={navItems} activeHref="/media" />

      <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8 space-y-12">

        {/* Header */}
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#2a6670]">In the news</p>
          <h1 className="display-font mt-3 text-5xl font-bold text-[#1f2d39] sm:text-6xl">Media & Press</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#4f5f69]">
            Sudha Devarakonda&apos;s appearances across television, radio, print, and digital media — 20+ years of conversations about voice, language, and storytelling.
          </p>
        </div>

        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#d8c8b0] bg-[#fffaf3] px-6 py-16 text-center">
            <p className="text-2xl mb-2">🎙️</p>
            <p className="font-semibold text-[#1f2d39]">Media appearances coming soon</p>
            <p className="text-sm text-[#60717b] mt-1">Check back shortly!</p>
          </div>
        )}

        {/* Featured */}
        {featured.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#2a6670] mb-5">Featured</p>
            <div className="grid gap-6 sm:grid-cols-2">
              {featured.map((item) => {
                const cat = CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.online;
                return (
                  <div key={item._id} className="rounded-2xl border border-[#d8c8b0] bg-[#fffaf3] overflow-hidden shadow-sm hover:shadow-md transition hover:-translate-y-0.5">
                    {item.imageUrl && (
                      <div className="h-48 overflow-hidden">
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    {!item.imageUrl && (
                      <div className="h-24 flex items-center justify-center text-4xl" style={{ background: cat.bg }}>
                        🎙️
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: cat.bg, color: cat.text, border: `1px solid ${cat.border}` }}>
                          {CATEGORY_ICONS[item.category]}
                          {CATEGORY_LABELS[item.category]}
                        </span>
                        <span className="text-xs text-[#8fa3ad]">{new Date(item.date + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</span>
                      </div>
                      <h2 className="display-font text-xl font-bold text-[#1f2d39]">{item.title}</h2>
                      <p className="text-sm font-semibold text-[#2a6670] mt-1">{item.outlet}</p>
                      {item.description && <p className="mt-2 text-sm text-[#4f5f69] leading-relaxed">{item.description}</p>}
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#1f6973] hover:underline">
                          View appearance →
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All appearances */}
        {rest.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#2a6670] mb-5">All appearances</p>
            <div className="space-y-3">
              {rest.map((item) => {
                const cat = CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.online;
                return (
                  <div key={item._id} className="flex items-center gap-4 rounded-2xl border border-[#e0d4c0] bg-[#fffaf3] px-5 py-4 hover:shadow-sm transition">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <div className="h-14 w-14 shrink-0 rounded-xl flex items-center justify-center text-xl" style={{ background: cat.bg }}>🎙️</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: cat.bg, color: cat.text }}>
                          {CATEGORY_ICONS[item.category]}
                          {CATEGORY_LABELS[item.category]}
                        </span>
                        <span className="text-xs text-[#8fa3ad]">{new Date(item.date + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</span>
                      </div>
                      <p className="font-bold text-[#1f2d39] truncate">{item.title}</p>
                      <p className="text-sm text-[#2a6670]">{item.outlet}</p>
                    </div>
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noopener noreferrer" className="shrink-0 text-sm font-bold text-[#1f6973] hover:underline">
                        View →
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
