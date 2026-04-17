import Link from "next/link";
import { getPodcastNav } from "@/components/AuthNav";
import { NewsletterForm } from "@/components/NewsletterForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getPodcastEpisodes } from "@/lib/content-store";
import { formatDisplayDate, formatDurationMinutes } from "@/lib/site-data";

export default async function PodcastsPage() {
  const navItems = await getPodcastNav();
  const episodes = await getPodcastEpisodes();

  return (
    <div className="page-shell">
      <SiteHeader navItems={navItems} activeHref="/podcasts" />

      <main className="page-inner px-4 pb-10 pt-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <section className="editorial-card p-8 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2a6670]">
              Podcast Archive
            </p>
            <h1 className="display-font mt-3 text-5xl font-bold text-[#1f2d39] sm:text-6xl">
              Podcasts
            </h1>
            <p className="mt-4 max-w-3xl text-[#4f5f69]">
              Listen to original conversations, reflections, and audio stories published for listeners who enjoy thoughtful long-form content.
            </p>
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
