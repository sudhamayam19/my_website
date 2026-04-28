import type { Metadata } from "next";
import Link from "next/link";
import { getPodcastNav } from "@/components/AuthNav";
import { NewsletterForm } from "@/components/NewsletterForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getPodcastEpisodes } from "@/lib/content-store";
import { formatDisplayDate, formatDurationMinutes } from "@/lib/site-data";

export const metadata: Metadata = {
  alternates: {
    types: {
      "application/rss+xml": "/api/podcast/feed.xml",
    },
  },
};

export default async function PodcastsPage() {
  const navItems = await getPodcastNav();
  const episodes = await getPodcastEpisodes();

  return (
    <div className="page-shell">
      <SiteHeader navItems={navItems} activeHref="/podcasts" />

      <main className="page-inner px-4 pb-10 pt-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <section className="editorial-card p-8 sm:p-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2a6670]">
                  Podcast Archive
                </p>
                <h1 className="display-font mt-3 text-5xl font-bold text-[#1f2d39] sm:text-6xl">
                  Podcasts
                </h1>
                <p className="mt-4 max-w-3xl text-[#4f5f69]">
                  Listen to original conversations, reflections, and audio stories published for listeners who enjoy thoughtful long-form content.
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                <a
                  href="/api/podcast/feed.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-[#d8c8b0] bg-white px-4 py-2 text-sm font-semibold text-[#1f6973] transition hover:bg-[#e8f4f5]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z"/>
                  </svg>
                  RSS Feed
                </a>
                <p className="text-xs text-[#8fa3ad]">Subscribe in any podcast app</p>
              </div>
            </div>
          </section>

          {/* Support banner */}
          <section className="mt-6 rounded-2xl border border-[#d89a55]/40 bg-gradient-to-r from-[#fff9ef] to-[#fffaf3] px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🙏</span>
                <div>
                  <p className="font-bold text-[#1f2d39]">Enjoy Sudha&apos;s podcast?</p>
                  <p className="text-sm text-[#50616d]">4 years of conversations — support her to keep going.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`upi://pay?pa=${encodeURIComponent(process.env.NEXT_PUBLIC_UPI_ID ?? "sudha@upi")}&pn=Sudha%20Devarakonda&cu=INR`}
                  className="inline-flex items-center gap-2 rounded-full bg-[#1f6973] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#185860]"
                >
                  Support via UPI
                </a>
                <a
                  href="https://buymeacoffee.com/sudha"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-[#d8c8b0] bg-white px-5 py-2 text-sm font-bold text-[#1f2d39] transition hover:bg-[#fff9ef]"
                >
                  ☕ Buy a coffee
                </a>
              </div>
            </div>
          </section>

          <section className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {episodes.length ? (
              episodes.map((episode) => (
                <Link key={episode.id} href={`/podcasts/${episode.id}`} className="group block">
                  <article className="editorial-card h-full overflow-hidden transition group-hover:-translate-y-1">
                    <div
                      className={`h-52 ${episode.coverImageUrl ? "" : "bg-gradient-to-br from-[#2f6c76] via-[#3e8c89] to-[#d89a55]"}`}
                      style={
                        episode.coverImageUrl
                          ? {
                              backgroundImage: `url(${episode.coverImageUrl})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }
                          : undefined
                      }
                    />
                    <div className="space-y-4 p-6">
                      <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-[#60717b]">
                        <span className="editorial-chip">{formatDurationMinutes(episode.durationMinutes)}</span>
                        <span>{formatDisplayDate(episode.publishedAt)}</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2a6670]">
                          {episode.showTitle}
                        </p>
                        <h2 className="display-font mt-3 text-3xl font-bold text-[#1f2d39]">
                          {episode.title}
                        </h2>
                      </div>
                      <p className="text-sm leading-relaxed text-[#4f5f69]">{episode.excerpt}</p>
                      {episode.tags && episode.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {episode.tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-[#e8f4f5] px-2.5 py-0.5 text-xs font-medium text-[#1f6973]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm text-[#60717b]">
                        <span>{(episode.listens ?? 0).toLocaleString()} listens</span>
                        <span className="font-semibold text-[#2a6670]">Open episode</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-[#c8b397] bg-[#fff9ef] px-6 py-8 text-[#50616d]">
                No podcast episodes are published yet.
              </p>
            )}
          </section>

          <section className="mt-16">
            <NewsletterForm />
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
