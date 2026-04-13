import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPodcastNav } from "@/components/AuthNav";
import { PodcastPlayer } from "@/components/PodcastPlayer";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getPodcastEpisodeById, getPodcastEpisodes } from "@/lib/content-store";
import { formatDisplayDate, formatDurationMinutes, SITE_NAME } from "@/lib/site-data";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const episode = await getPodcastEpisodeById(id);
  if (!episode) return { title: `Podcasts | ${SITE_NAME}` };
  return {
    title: `${episode.title} | ${SITE_NAME}`,
    description: episode.seoDescription || episode.excerpt,
    openGraph: episode.coverImageUrl ? { images: [episode.coverImageUrl] } : undefined,
  };
}

export default async function PodcastEpisodePage({ params }: Props) {
  const { id } = await params;
  const navItems = await getPodcastNav();
  const [episode, allEpisodes] = await Promise.all([
    getPodcastEpisodeById(id),
    getPodcastEpisodes(),
  ]);

  if (!episode || episode.status !== "published") notFound();

  const related = allEpisodes.filter((e) => e.id !== episode.id && e.status === "published").slice(0, 4);

  return (
    <div className="page-shell">
      <SiteHeader navItems={navItems} activeHref="/podcasts" />

      {/* ── Spotify-style hero player ── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: episode.coverImageUrl
            ? `linear-gradient(to bottom, #1a2f3a 0%, #0f1e26 100%)`
            : `linear-gradient(135deg, #1a3a42 0%, #0f1e26 60%, #2a1a0e 100%)`,
        }}
      >
        {/* Blurred background from cover art */}
        {episode.coverImageUrl && (
          <div
            className="absolute inset-0 scale-110 opacity-25 blur-2xl"
            style={{
              backgroundImage: `url(${episode.coverImageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}

        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-10 md:flex-row md:items-end">

            {/* Cover art */}
            <div className="shrink-0">
              {episode.coverImageUrl ? (
                <img
                  src={episode.coverImageUrl}
                  alt={episode.title}
                  className="h-56 w-56 rounded-2xl object-cover shadow-2xl sm:h-64 sm:w-64"
                />
              ) : (
                <div className="flex h-56 w-56 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2f6c76] to-[#d89a55] shadow-2xl sm:h-64 sm:w-64">
                  <svg width="72" height="72" viewBox="0 0 24 24" fill="white" opacity="0.7">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                </div>
              )}
            </div>

            {/* Info + player */}
            <div className="flex-1 w-full">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                {episode.showTitle}
              </p>
              <h1 className="display-font mt-2 text-3xl font-black text-white sm:text-4xl lg:text-5xl">
                {episode.title}
              </h1>
              <p className="mt-3 text-sm text-white/60 leading-relaxed line-clamp-2">
                {episode.excerpt}
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/40 font-medium">
                <span>{formatDisplayDate(episode.publishedAt)}</span>
                <span>·</span>
                <span>{formatDurationMinutes(episode.durationMinutes)}</span>
                <span>·</span>
                <span>{(episode.listens ?? 0).toLocaleString()} listens</span>
              </div>

              {/* Player */}
              <div className="mt-8">
                <PodcastPlayer episodeId={episode.id} audioUrl={episode.audioUrl} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content below ── */}
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">

          {/* Description */}
          <div className="editorial-card p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2a6670] mb-5">About this episode</p>
            <p className="whitespace-pre-line text-base leading-relaxed text-[#344854]">
              {episode.description || episode.excerpt}
            </p>
          </div>

          {/* More episodes */}
          <aside className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2a6670] px-1">More Episodes</p>
            {related.length > 0 ? related.map((ep) => (
              <Link
                key={ep.id}
                href={`/podcasts/${ep.id}`}
                className="flex gap-4 rounded-2xl border border-[#d8c8b0] bg-[#fffaf3] p-4 transition hover:shadow-md hover:-translate-y-0.5 group"
              >
                {ep.coverImageUrl ? (
                  <img src={ep.coverImageUrl} alt={ep.title} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2f6c76] to-[#d89a55]">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs text-[#60717b] font-medium">{formatDurationMinutes(ep.durationMinutes)}</p>
                  <p className="mt-0.5 font-bold text-[#1f2d39] text-sm leading-snug line-clamp-2 group-hover:text-[#2a6670] transition-colors">
                    {ep.title}
                  </p>
                </div>
              </Link>
            )) : (
              <p className="rounded-xl border border-dashed border-[#d8c8b0] px-4 py-5 text-sm text-[#60717b]">
                More episodes coming soon.
              </p>
            )}
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
