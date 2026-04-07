import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPodcastNav } from "@/components/AuthNav";
import { PodcastPlayer } from "@/components/PodcastPlayer";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getPodcastEpisodeById, getPodcastEpisodes } from "@/lib/content-store";
import { formatDisplayDate, formatDurationMinutes, SITE_NAME } from "@/lib/site-data";

interface PodcastEpisodePageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: PodcastEpisodePageProps): Promise<Metadata> {
  const { id } = await params;
  const episode = await getPodcastEpisodeById(id);
  if (!episode) {
    return {
      title: `Podcasts | ${SITE_NAME}`,
    };
  }

  return {
    title: `${episode.title} | ${SITE_NAME}`,
    description: episode.seoDescription || episode.excerpt,
  };
}

export default async function PodcastEpisodePage({
  params,
}: PodcastEpisodePageProps) {
  const { id } = await params;
  const navItems = await getPodcastNav();
  const [episode, allEpisodes] = await Promise.all([
    getPodcastEpisodeById(id),
    getPodcastEpisodes(),
  ]);

  if (!episode || episode.status !== "published") {
    notFound();
  }

  const relatedEpisodes = allEpisodes
    .filter((item) => item.id !== episode.id)
    .slice(0, 3);

  return (
    <div className="page-shell">
      <SiteHeader navItems={navItems} activeHref="/podcasts" />

      <main className="page-inner px-4 pb-12 pt-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="editorial-card overflow-hidden">
            <div
              className={`h-72 ${episode.coverImageUrl ? "" : "bg-gradient-to-br from-[#2f6c76] via-[#3e8c89] to-[#d89a55]"}`}
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
            <div className="space-y-6 p-8 sm:p-10">
              <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-[#60717b]">
                <span className="editorial-chip">{formatDurationMinutes(episode.durationMinutes)}</span>
                <span>{formatDisplayDate(episode.publishedAt)}</span>
                <span>{(episode.listens ?? 0).toLocaleString()} listens</span>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2a6670]">
                  {episode.showTitle}
                </p>
                <h1 className="display-font mt-3 text-5xl font-bold text-[#1f2d39] sm:text-6xl">
                  {episode.title}
                </h1>
                <p className="mt-4 max-w-3xl text-lg leading-relaxed text-[#4f5f69]">
                  {episode.excerpt}
                </p>
              </div>

              <PodcastPlayer episodeId={episode.id} audioUrl={episode.audioUrl} />

              <div className="rounded-[1.8rem] border border-[#d8c8b0] bg-[#fff9ef] p-6">
                <p className="whitespace-pre-line text-base leading-relaxed text-[#344854]">
                  {episode.description}
                </p>
              </div>
            </div>
          </article>

          <aside className="space-y-6">
            <section className="editorial-card p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2a6670]">
                Listening Notes
              </p>
              <ul className="mt-5 space-y-3 text-sm text-[#445963]">
                <li className="rounded-xl border border-[#d8c8b0] bg-[#fbf4e7] p-4">
                  Listen directly here without leaving the website.
                </li>
                <li className="rounded-xl border border-[#d8c8b0] bg-[#fbf4e7] p-4">
                  New episodes can be uploaded from the admin dashboard and the phone app.
                </li>
                <li className="rounded-xl border border-[#d8c8b0] bg-[#fbf4e7] p-4">
                  Later, the same library can be published to external podcast apps through RSS.
                </li>
              </ul>
            </section>

            <section className="editorial-card p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2a6670]">
                More Episodes
              </p>
              <div className="mt-5 space-y-4">
                {relatedEpisodes.length ? (
                  relatedEpisodes.map((item) => (
                    <a
                      key={item.id}
                      href={`/podcasts/${item.id}`}
                      className="block rounded-2xl border border-[#d8c8b0] bg-[#fff9ef] p-4 transition hover:-translate-y-0.5"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#60717b]">
                        {formatDurationMinutes(item.durationMinutes)}
                      </p>
                      <h2 className="mt-2 text-lg font-semibold text-[#1f2d39]">
                        {item.title}
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-[#4f5f69]">
                        {item.excerpt}
                      </p>
                    </a>
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed border-[#d8c8b0] px-4 py-5 text-sm text-[#60717b]">
                    More episodes will appear here once the archive grows.
                  </p>
                )}
              </div>
            </section>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
