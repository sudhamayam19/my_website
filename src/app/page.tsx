import Link from "next/link";
import { getHomeNav } from "@/components/AuthNav";
import { NewsletterForm } from "@/components/NewsletterForm";
import { PlatformIcon } from "@/components/PlatformIcon";
import { CareerTimeline } from "@/components/CareerTimeline";
import { ChangeMakerSpotlight } from "@/components/ChangeMakerSpotlight";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getFeaturedPodcastEpisodes, getFeaturedPosts, getChangeMakers } from "@/lib/content-store";
import { isAdminAuthenticated } from "@/lib/simple-auth";
import {
  formatDisplayDate,
  formatDurationMinutes,
  mediaCards,
} from "@/lib/site-data";

export default async function HomePage() {
  const homeNav = await getHomeNav({ includeJourney: true, includeMedia: true, includeBlog: true });
  const [featuredPosts, featuredEpisodes, changeMakers] = await Promise.all([
    getFeaturedPosts(3),
    getFeaturedPodcastEpisodes(3),
    getChangeMakers(true),
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
              <div className="flex flex-col items-center gap-10 md:flex-row md:items-center">

                {/* Photo */}
                <div className="shrink-0">
                  <img
                    src="/sudha.jpg"
                    alt="Sudha Devarakonda"
                    className="h-48 w-48 rounded-full object-cover shadow-xl ring-4 ring-[#d8c8b0] sm:h-56 sm:w-56"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                  <p className="editorial-hero-tag">RJ · Translator · Voice Artist · Podcaster</p>
                  <h1 className="display-font mt-4 text-5xl font-bold leading-tight text-[#1d2d3c] sm:text-6xl">
                    Sudha Devarakonda
                  </h1>
                  <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#4f5f69]">
                    Discover original writing, podcast episodes, reflections on voice and translation,
                    and thoughtful stories from Sudha Devarakonda&apos;s work across audio and language.
                  </p>
                  <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
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
            </div>
          </div>
        </section>

        {/* ── Change Makers ── */}
        <ChangeMakerSpotlight items={changeMakers} />

        {/* ── Career Timeline ── */}
        <CareerTimeline />

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
                        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#2a6670] group-hover:gap-2 transition-all">
                          Read more <span>→</span>
                        </span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Newsletter ── */}
        <section className="px-4 pb-4 pt-2 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <NewsletterForm />
          </div>
        </section>

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
                        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#2a6670] group-hover:gap-2 transition-all">
                          Listen now <span>→</span>
                        </span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Platforms ── */}
        <section id="media" className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2a6670] mb-4">
              Find me on
            </p>
            <div className="flex flex-wrap gap-3">
              {mediaCards.map((card) => (
                <a
                  key={card.id}
                  href={card.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex items-center gap-3 rounded-full border border-[#d8c8b0] bg-[#fffaf3] px-5 py-3 transition hover:shadow-md hover:-translate-y-0.5`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${card.gradientClass} text-white`}>
                    <PlatformIcon platformId={card.id} className="h-4 w-4" />
                  </span>
                  <span className="font-semibold text-[#1f2d39] text-sm">{card.platform}</span>
                  <span className="text-xs text-[#2a6670] font-medium">{card.buttonLabel} →</span>
                </a>
              ))}
            </div>
          </div>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}
