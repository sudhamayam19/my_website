import type { Metadata } from "next";
import { getHomeNav } from "@/components/AuthNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE_NAME } from "@/lib/site-data";

export const metadata: Metadata = {
  title: `Work With Me | ${SITE_NAME}`,
  description:
    "Hire Sudha Devarakonda for voice-over, dubbing, Telugu–English translation, RJ & event hosting, and podcast collaborations.",
};

interface Service {
  icon: string;
  title: string;
  blurb: string;
  points: string[];
  from: string;
}

const SERVICES: Service[] = [
  {
    icon: "🎙️",
    title: "Voice-Over & Narration",
    blurb: "Warm, professional voice for ads, explainers, audiobooks, IVR, and YouTube — in Telugu & English.",
    points: ["Commercials & radio spots", "Corporate & explainer videos", "Audiobook & e-learning narration", "Studio-quality delivery"],
    from: "₹1,500",
  },
  {
    icon: "🎬",
    title: "Dubbing & Localization",
    blurb: "Bring films, series, and ads to Telugu audiences with natural, lip-synced dubbing.",
    points: ["Film & web-series dubbing", "Ad & promo localization", "Character voicing", "Telugu nativisation"],
    from: "₹2,500",
  },
  {
    icon: "🌐",
    title: "Telugu ↔ English Translation",
    blurb: "Literary, accurate translation that keeps the soul of the original — not word-for-word.",
    points: ["Articles, scripts & subtitles", "Books & long-form", "Marketing & social copy", "Proofreading & polish"],
    from: "₹1,000",
  },
  {
    icon: "✨",
    title: "RJ, Anchoring & Hosting",
    blurb: "Engaging host for events, shows, and live sessions — bilingual, audience-loved energy.",
    points: ["Stage & event anchoring", "Podcast / show hosting", "Brand launch emceeing", "Live audio sessions"],
    from: "On request",
  },
  {
    icon: "🎧",
    title: "Podcast Collaboration",
    blurb: "Feature your brand or story on the Sudha Mayam podcast, or co-create a branded episode.",
    points: ["Sponsored episodes", "Guest interviews", "Branded series", "Audience: cricket, culture, women"],
    from: "On request",
  },
  {
    icon: "✍️",
    title: "Content & Blog Writing",
    blurb: "Original Telugu/English articles on cricket, culture, women, and lifestyle for your platform.",
    points: ["Ghost-written articles", "Brand storytelling", "Social captions", "SEO-friendly posts"],
    from: "₹800",
  },
];

const STEPS = [
  { n: "1", t: "Tell me your project", d: "Share what you need — script, deadline, language, and budget." },
  { n: "2", t: "Get a quote", d: "I'll send a clear quote and timeline within 24 hours." },
  { n: "3", t: "Approve & pay advance", d: "Lock the slot with a small advance via UPI." },
  { n: "4", t: "Receive your work", d: "Delivered on time, with revisions until you're happy." },
];

export default async function ServicesPage() {
  const navItems = await getHomeNav({ includeJourney: true, includeMedia: true });
  const email = "sudhamayam19@gmail.com";
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ""; // e.g. 919876543210
  const waLink = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent("Hi Sudha! I'd like to enquire about your services.")}`
    : "";
  const mailLink = `mailto:${email}?subject=${encodeURIComponent("Service Enquiry")}&body=${encodeURIComponent("Hi Sudha,\n\nI'd like to enquire about:\n- Service: \n- Project details: \n- Deadline: \n- Budget: \n\nThanks!")}`;

  return (
    <div className="page-shell">
      <SiteHeader navItems={navItems} activeHref="/services" />

      <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8 space-y-14">
        {/* Hero */}
        <section className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#2a6670]">Work with me</p>
          <h1 className="display-font mt-3 text-5xl font-bold text-[#1f2d39] sm:text-6xl">
            Hire Sudha
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#4f5f69]">
            RJ, voice artist, translator & storyteller with years on air and behind the mic.
            Let&apos;s create something people will listen to, read, and remember.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a href={mailLink} className="inline-flex items-center gap-2 rounded-full bg-[#1f6973] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#185860]">
              Get a quote
            </a>
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#25d366] bg-[#25d366]/10 px-6 py-3 text-sm font-bold text-[#1a8f47] transition hover:bg-[#25d366]/20">
                💬 WhatsApp me
              </a>
            )}
          </div>
        </section>

        {/* Services grid */}
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <div key={s.title} className="flex flex-col rounded-2xl border border-[#d8c8b0] bg-[#fffaf3] p-6 transition hover:shadow-md hover:-translate-y-0.5">
              <div className="text-3xl">{s.icon}</div>
              <h3 className="display-font mt-3 text-xl font-bold text-[#1f2d39]">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#50616d]">{s.blurb}</p>
              <ul className="mt-4 space-y-1.5">
                {s.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-[#455964]">
                    <span className="mt-1 text-[#1f6973]">✓</span>{p}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-center justify-between border-t border-[#e8dece] pt-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#8fa3ad]">Starting</span>
                <span className="display-font text-lg font-bold text-[#1f6973]">{s.from}</span>
              </div>
            </div>
          ))}
        </section>

        {/* How it works */}
        <section className="rounded-3xl border border-[#d8c8b0] bg-gradient-to-br from-[#fff9ef] to-[#fffaf3] p-8">
          <h2 className="display-font text-center text-3xl font-bold text-[#1f2d39]">How it works</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1f6973] text-lg font-bold text-white">{s.n}</div>
                <h3 className="mt-3 font-bold text-[#1f2d39]">{s.t}</h3>
                <p className="mt-1 text-sm text-[#60717b]">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-3xl bg-[#1f3a40] px-6 py-12 text-center">
          <h2 className="display-font text-3xl font-bold text-white sm:text-4xl">Ready to start?</h2>
          <p className="mx-auto mt-3 max-w-xl text-[#bcd4d6]">
            Tell me about your project and I&apos;ll reply within 24 hours with a quote and timeline.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a href={mailLink} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#1f3a40] transition hover:bg-[#e8f4f5]">
              📧 Email enquiry
            </a>
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1ea952]">
                💬 WhatsApp
              </a>
            )}
          </div>
          <p className="mt-5 text-xs text-[#7fa0a4]">Prices are indicative and vary by scope. Advance secured via UPI.</p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
