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

  const published = allEpisodes.filter((e) => e.status === "published");
  // Sort by date ascending so index reflects chronological order
  const sorted = [...published].sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
  const idx = sorted.findIndex((e) => e.id === episode.id);
  const prevEp = idx > 0 ? sorted[idx - 1] : null;
  const nextEp = idx < sorted.length - 1 ? sorted[idx + 1] : null;

  const related = published.filter((e) => e.id !== episode.id).slice(0, 4);

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

          {/* Prev / Next navigation */}
          {(prevEp ?? nextEp) && (
            <div className="mt-10 flex items-center justify-between gap-4 border-t border-white/10 pt-8">
              {prevEp ? (
                <Link
                  href={`/podcasts/${prevEp.id}`}
                  className="group flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 transition hover:bg-white/10 max-w-[45%]"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-white/40">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Previous</p>
                    <p className="mt-0.5 text-sm font-semibold text-white/70 line-clamp-1 group-hover:text-white transition-colors">{prevEp.title}</p>
                  </div>
                </Link>
              ) : <div />}

              {nextEp ? (
                <Link
                  href={`/podcasts/${nextEp.id}`}
                  className="group flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 transition hover:bg-white/10 max-w-[45%] text-right"
                >
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Next</p>
                    <p className="mt-0.5 text-sm font-semibold text-white/70 line-clamp-1 group-hover:text-white transition-colors">{nextEp.title}</p>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-white/40">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </Link>
              ) : <div />}
            </div>
          )}
        </div>
      </div>

      {/* ── Content below ── */}
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">

          {/* Description + Support */}
          <div className="space-y-6">
            <div className="editorial-card p-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2a6670] mb-5">About this episode</p>
              <p className="whitespace-pre-line text-base leading-relaxed text-[#344854]">
                {episode.description || episode.excerpt}
              </p>
            </div>

            {/* Support card */}
            <SupportCard />
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

            {/* RSS badge */}
            <a
              href="/api/podcast/feed.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-[#d8c8b0] bg-[#fffaf3] px-4 py-3 text-sm font-semibold text-[#2a6670] transition hover:shadow-md"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z"/>
              </svg>
              Subscribe via RSS
            </a>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function SupportCard() {
  const upiId = process.env.NEXT_PUBLIC_UPI_ID ?? "sudha@upi";
  const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=Sudha%20Devarakonda&cu=INR`;

  return (
    <div className="rounded-2xl border border-[#d89a55]/40 bg-gradient-to-br from-[#fff9ef] to-[#fffaf3] p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d89a55]/15 text-xl">
          🙏
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#1f2d39]">Enjoy the podcast?</p>
          <p className="mt-1 text-sm text-[#50616d] leading-relaxed">
            Sudha has been creating content for 4 years. Your support helps keep the episodes coming — every contribution matters.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={upiLink}
              className="inline-flex items-center gap-2 rounded-full bg-[#1f6973] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#185860]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
              </svg>
              Support via UPI
            </a>
            <a
              href="https://buymeacoffee.com/sudha"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[#d8c8b0] bg-white px-5 py-2.5 text-sm font-bold text-[#1f2d39] transition hover:bg-[#fff9ef]"
            >
              ☕ Buy me a coffee
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
