import type { Metadata } from "next";
import { getHomeNav } from "@/components/AuthNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE_NAME } from "@/lib/site-data";

export const metadata: Metadata = {
  title: `Contact | ${SITE_NAME}`,
  description: "Get in touch with Sudha Devarakonda — collaborations, voice work, translations, and podcast enquiries.",
};

const socials = [
  {
    id: "instagram",
    label: "Instagram",
    handle: "@devarakonda.sudha.1",
    href: "https://www.instagram.com/devarakonda.sudha.1?igsh=cjE5aDQzOGsxdmVq",
    color: "#e1306c",
    bg: "#fff0f5",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    id: "youtube",
    label: "YouTube",
    handle: "@sudhamayam",
    href: "https://youtube.com/@sudhamayam?si=IhQWkDIrhwcWyMNJ",
    color: "#ff0000",
    bg: "#fff5f5",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
  {
    id: "spotify",
    label: "Spotify",
    handle: "Sudha Mayam Podcast",
    href: "https://open.spotify.com/show/2aZL5tQATcdx7xCypHXJrI",
    color: "#1db954",
    bg: "#f0fff4",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
      </svg>
    ),
  },
];

export default async function ContactPage() {
  const navItems = await getHomeNav({ includeJourney: true, includeMedia: true });
  const upiId = process.env.NEXT_PUBLIC_UPI_ID ?? "sudha@upi";
  const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=Sudha%20Devarakonda&cu=INR`;

  return (
    <div className="page-shell">
      <SiteHeader navItems={navItems} activeHref="/contact" />

      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8 space-y-10">

        {/* Header */}
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#2a6670]">Connect with me</p>
          <h1 className="display-font mt-3 text-5xl font-bold text-[#1f2d39] sm:text-6xl">Get in touch</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#4f5f69]">
            For collaborations, voice work, translations, podcast enquiries, or just to say hello — reach out through any of these channels.
          </p>
        </div>

        {/* Email */}
        <div className="rounded-2xl border border-[#d8c8b0] bg-[#fffaf3] p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#1f5562]/10 text-[#1f5562]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-[#2a6670]">Email</p>
            <p className="mt-1 text-lg font-bold text-[#1f2d39]">sudhamayam19@gmail.com</p>
            <p className="text-sm text-[#60717b]">For professional enquiries and collaborations</p>
          </div>
          <a
            href="mailto:sudhamayam19@gmail.com"
            className="shrink-0 inline-flex items-center gap-2 rounded-full bg-[#1f5562] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#174450]"
          >
            Send email
          </a>
        </div>

        {/* Social links */}
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#2a6670] mb-4">Follow & connect</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {socials.map((s) => (
              <a
                key={s.id}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-2xl border border-[#d8c8b0] p-5 transition hover:shadow-md hover:-translate-y-0.5"
                style={{ background: s.bg }}
              >
                <div style={{ color: s.color }}>{s.icon}</div>
                <div className="min-w-0">
                  <p className="font-bold text-[#1f2d39]">{s.label}</p>
                  <p className="text-xs text-[#60717b] truncate">{s.handle}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto shrink-0 text-[#a0b4bc] group-hover:text-[#1f5562] transition-colors">
                  <path d="M7 7h10v10M7 17 17 7"/>
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* UPI Support */}
        <div className="rounded-2xl border border-[#d89a55]/40 bg-gradient-to-br from-[#fff9ef] to-[#fffaf3] p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-[#c8842a]">Support Sudha</p>
              <h2 className="display-font mt-2 text-2xl font-bold text-[#1f2d39]">Buy her a coffee ☕</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#50616d]">
                Sudha creates content independently. If her stories, podcast, or articles have meant something to you, your support helps keep it going.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={upiLink}
                  className="inline-flex items-center gap-2 rounded-full bg-[#1f6973] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#185860]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                  </svg>
                  Pay via UPI
                </a>
                <a
                  href="https://buymeacoffee.com/sudha"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-[#d8c8b0] bg-white px-5 py-2.5 text-sm font-bold text-[#1f2d39] transition hover:bg-[#fff9ef]"
                >
                  Buy Me a Coffee
                </a>
              </div>
            </div>

            {/* QR Code placeholder — replace with real image once received */}
            <div className="flex shrink-0 flex-col items-center gap-2">
              <div className="flex h-36 w-36 items-center justify-center rounded-2xl border-2 border-dashed border-[#d89a55]/60 bg-white text-center text-xs text-[#a0b4bc] p-3">
                <div>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-2 text-[#d89a55]/60">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                    <path d="M14 14h3v3h-3zM17 17h3v3h-3zM14 20h3"/>
                  </svg>
                  UPI QR Code<br/>coming soon
                </div>
              </div>
              <p className="text-xs text-[#a0b4bc]">Scan to pay</p>
            </div>
          </div>
        </div>

      </main>

      <SiteFooter />
    </div>
  );
}
