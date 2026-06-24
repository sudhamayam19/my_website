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

type Photo = { src: string; caption?: string; category?: string };
const photos: Photo[] = [
  { src: "/gallery/photo-1.jpg" },
  { src: "/gallery/photo-2.jpg" },
  { src: "/gallery/photo-3.jpg" },
  { src: "/gallery/photo-4.jpg" },
  { src: "/gallery/photo-5.jpg" },
  { src: "/gallery/photo-6.jpg" },
  { src: "/gallery/photo-7.jpg" },
  { src: "/gallery/photo-8.jpg" },
  { src: "/gallery/photo-9.jpg" },
  { src: "/gallery/photo-10.jpg" },
  { src: "/gallery/photo-11.jpg" },
  { src: "/gallery/photo-12.jpg" },
  { src: "/gallery/photo-13.jpg" },
  { src: "/gallery/photo-14.jpg" },
  { src: "/gallery/photo-15.jpg" },
  { src: "/gallery/photo-16.jpg" },
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
