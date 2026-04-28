import { getHomeNav } from "@/components/AuthNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default async function AboutPage() {
  const navItems = await getHomeNav({ includeJourney: true, includeMedia: true });

  return (
    <div className="page-shell">
      <SiteHeader navItems={navItems} activeHref="/about" />

      <main className="page-inner px-4 pb-10 pt-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-8">
          <section className="editorial-card p-8 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2a6670]">
              About
            </p>
            <h1 className="display-font mt-3 text-5xl font-bold text-[#1f2d39] sm:text-6xl">
              Sudha Devarakonda
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-[#4f5f69] sm:text-lg">
              Sudha Devarakonda is an RJ, translator, voice artist, and podcast host whose work
              brings together spoken storytelling, language, and thoughtful media conversations.
              This website shares her articles, podcast episodes, and reflections from years of
              work in audio and communication.
            </p>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <article className="editorial-card p-6">
              <h2 className="display-font text-3xl font-bold text-[#1f2d39]">What you&apos;ll find here</h2>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[#4f5f69]">
                <li>Original blog posts on voice, radio, translation, podcasting, and storytelling.</li>
                <li>Podcast episodes listeners can play directly on the site.</li>
                <li>Personal reflections and media insights shaped by real creative work.</li>
                <li>Useful updates for readers who follow Sudha&apos;s content across platforms.</li>
              </ul>
            </article>

            <article className="editorial-card p-6">
              <h2 className="display-font text-3xl font-bold text-[#1f2d39]">Why this site exists</h2>
              <p className="mt-4 text-sm leading-relaxed text-[#4f5f69]">
                This site is designed to be a lasting home for Sudha&apos;s writing and audio work,
                independent of fast-moving social platforms. The goal is to publish original,
                useful, and reader-friendly content that can be discovered, shared, and revisited.
              </p>
            </article>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
