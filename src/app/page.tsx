import Link from "next/link";
import { getHomeNav } from "@/components/AuthNav";
import { NewsletterForm } from "@/components/NewsletterForm";
import { PlatformIcon } from "@/components/PlatformIcon";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getFeaturedPodcastEpisodes, getFeaturedPosts } from "@/lib/content-store";
import { isAdminAuthenticated } from "@/lib/simple-auth";
import { TimelineMilestoneCard } from "@/components/TimelineMilestoneCard";
import {
  formatDisplayDate,
  formatDurationMinutes,
  mediaCards,
  timelineEvents,
} from "@/lib/site-data";

export default async function HomePage() {
  const homeNav = await getHomeNav({ includeJourney: true, includeMedia: true, includeBlog: true });
  const [featuredPosts, featuredEpisodes] = await Promise.all([
    getFeaturedPosts(3),
    getFeaturedPodcastEpisodes(3),
  ]);
  const showAdminAccess = await isAdminAuthenticated();

  return (
    <div className="page-shell">
      <SiteHeader navItems={homeNav} activeHref="/" />

      <main className="page-inner">

        {/* ── Hero ── */}
        <section className="px-4 pb-10 pt-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="editorial-hero px-8 py-10 sm:px-12 sm:py-12">
              <p className="editorial-hero-tag">RJ · Translator · Voice Artist · Podcaster</p>
              <h1 className="display-font mt-4 max-w-3xl text-5xl font-bold leading-tight text-[#1d2d3c] sm:text-6xl">
                Sudha Devarakonda
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#4f5f69]">
                Two decades of stories told through radio, voice, and language.
                Explore Sudha&apos;s articles, podcast conversations, and reflections on culture, spirituality, and life.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/blog" className="editorial-btn-primary">
                  Read the blog
                </Link>
                <Link href="/podcasts" className="editorial-btn-secondary">
                  Listen to podcasts
                </Link>
                {showAdminAccess && (
                  <Link href="/admin" className="editorial-btn-secondary">
                    Open admin
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Career Timeline ── */}
        <section id="journey" className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2a6670]">
                Career Timeline
              </p>
              <h2 className="display-font mt-2 text-4xl font-bold text-[#1f2d39] sm:text-5xl">
                A voice career in milestones
              </h2>
            </div>
            <div className="space-y-5">
              {timelineEvents.map((event) => (
                <TimelineMilestoneCard key={`${event.year}-${event.title}`} event={event} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Featured Posts ── */}
        {featuredPosts.length > 0 && (
          <section className="px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2a6670]">
                    Featured Writing
                  </p>
                  <h2 className="display-font mt-2 text-4xl font-bold text-[#1f2d39] sm:text-5xl">
                    Latest articles
                  </h2>
                </div>
                <Link href="/blog" className="editorial-btn-secondary">
                  View all articles
                </Link>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {featuredPosts.map((post) => (
                  <Link key={post.id} href={`/blog/${post.id}`} className="group block">
                    <article className="editorial-card h-full overflow-hidden transition group-hover:-translate-y-1">
                      <div
                        className={`h-44 ${post.coverImageUrl ? "" : `bg-gradient-to-br ${post.coverGradient}`}`}
                        style={
                          post.coverImageUrl
                            ? { backgroundImage: `url(${post.coverImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                            : undefined
                        }
                      />
                      <div className="p-6">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                          <span className="editorial-chip">{post.category}</span>
                          <span className="text-[#5f6f79]">{formatDisplayDate(post.publishedAt)}</span>
                        </div>
                        <h3 className="display-font mt-4 text-2xl font-bold text-[#1f2d39]">{post.title}</h3>
                        <p className="mt-3 text-sm leading-relaxed text-[#4f5f69]">{post.excerpt}</p>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Featured Podcast Episodes ── */}
        {featuredEpisodes.length > 0 && (
          <section className="px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2a6670]">
                    Featured Listening
                  </p>
                  <h2 className="display-font mt-2 text-4xl font-bold text-[#1f2d39] sm:text-5xl">
                    Latest podcast episodes
                  </h2>
                </div>
                <Link href="/podcasts" className="editorial-btn-secondary">
                  View all episodes
                </Link>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {featuredEpisodes.map((episode) => (
                  <Link key={episode.id} href={`/podcasts/${episode.id}`} className="group block">
                    <article className="editorial-card h-full overflow-hidden transition group-hover:-translate-y-1">
                      <div
                        className={`h-44 ${episode.coverImageUrl ? "" : "bg-gradient-to-br from-[#2f6c76] via-[#3e8c89] to-[#d89a55]"}`}
                        style={
                          episode.coverImageUrl
                            ? { backgroundImage: `url(${episode.coverImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                            : undefined
                        }
                      />
                      <div className="p-6">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                          <span className="editorial-chip">{formatDurationMinutes(episode.durationMinutes)}</span>
                          <span className="text-[#5f6f79]">{formatDisplayDate(episode.publishedAt)}</span>
                        </div>
                        <h3 className="display-font mt-4 text-2xl font-bold text-[#1f2d39]">{episode.title}</h3>
                        <p className="mt-3 text-sm leading-relaxed text-[#4f5f69]">{episode.excerpt}</p>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Platforms ── */}
        <section id="media" className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2a6670]">
                Platforms
              </p>
              <h2 className="display-font mt-2 text-4xl font-bold text-[#1f2d39] sm:text-5xl">
                Listen and watch
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {mediaCards.map((card) => (
                <article
                  key={card.id}
                  className="editorial-card group overflow-hidden transition hover:-translate-y-1"
                >
                  <div className={`relative flex h-36 items-center justify-center bg-gradient-to-br ${card.gradientClass} text-white`}>
                    <PlatformIcon platformId={card.id} className="h-16 w-16" />
                  </div>
                  <div className="p-6">
                    <h3 className="display-font text-3xl font-bold text-[#1f2d39]">{card.platform}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#4f5f69]">{card.description}</p>
                    <a href={card.href} target="_blank" rel="noopener noreferrer" className="editorial-btn-secondary mt-5">
                      {card.buttonLabel}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Newsletter ── */}
        <section className="px-4 pb-6 pt-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <NewsletterForm />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
