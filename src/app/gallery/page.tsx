import type { Metadata } from "next";
import { getHomeNav } from "@/components/AuthNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { GalleryGrid } from "@/components/GalleryGrid";
import { SITE_NAME } from "@/lib/site-data";

export const metadata: Metadata = {
  title: `Gallery | ${SITE_NAME}`,
  description: "Photos from Sudha Devarakonda's journey — radio studios, interviews, events and more.",
};

// Add photos here — just paste the URL and a caption
const photos = [
  // { src: "https://...", caption: "At Radio Mirchi Studio, 2018", category: "Radio" },
  // Photos coming soon — send them to be added!
];

export default async function GalleryPage() {
  const navItems = await getHomeNav({ includeJourney: true, includeMedia: true });

  return (
    <div className="page-shell">
      <SiteHeader navItems={navItems} activeHref="/gallery" />

      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#2a6670]">Moments</p>
          <h1 className="display-font mt-3 text-5xl font-bold text-[#1f2d39] sm:text-6xl">Gallery</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#4f5f69]">
            A glimpse into Sudha&apos;s world — radio studios, interviews, events, and the stories behind the voice.
          </p>
        </div>

        <GalleryGrid photos={photos} />
      </main>

      <SiteFooter />
    </div>
  );
}
