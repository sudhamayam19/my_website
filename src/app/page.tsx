import Link from "next/link";
import { getHomeNav } from "@/components/AuthNav";
import { NewsletterForm } from "@/components/NewsletterForm";
import { PlatformIcon } from "@/components/PlatformIcon";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getFeaturedPodcastEpisodes, getFeaturedPosts } from "@/lib/content-store";
import { isAdminAuthenticated } from "@/lib/simple-auth";
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
              <div className="flex flex-col items-center gap-10 md:flex-row md:items-center">

                {/* Photo */}
                {process.env.NEXT_PUBLIC_PROFILE_IMAGE_URL && (
                  <div className="shrink-0">
                    <img
                      src={process.env.NEXT_PUBLIC_PROFILE_IMAGE_URL}
                      alt="Sudha Devarakonda"
                      className="h-48 w-48 rounded-full object-cover shadow-xl ring-4 ring-[#d8c8b0] sm:h-56 sm:w-56"
                    />
                  </div>
                )}

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

        {/* ── Career Timeline (horizontal) ── */}
        <section id="journey" className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2a6670]">
                Career Timeline
              </p>
              <h2 className="display-font mt-2 text-4xl font-bold text-[#1f2d39] sm:text-5xl">
                A voice career in milestones
              </h2>
            </div>

            {/* Scrollable track */}
            <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6">
              <div className="relative min-w-[700px]">

                {/* Horizontal connecting line */}
                <div className="absolute top-[52px] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-[#2f7e87] via-[#a5894d] to-[#c07a2e]" />

                {/* Milestone nodes */}
                <div className="relative grid grid-cols-5 gap-2">
                  {timelineEvents.map((event, i) => {
                    const dotColors = [
                      "bg-[#2f7e87]", "bg-[#bb6a4b]", "bg-[#a5894d]",
                      "bg-[#366779]", "bg-[#c07a2e]",
                    ];
                    const borderColors = [
                      "border-[#2f7e87]", "border-[#bb6a4b]", "border-[#a5894d]",
                      "border-[#366779]", "border-[#c07a2e]",
                    ];
                    return (
                      <div key={event.year} className="flex flex-col items-center">
                        {/* Dot */}
                        <div className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-md ${dotColors[i]}`}>
                          <div className="h-2.5 w-2.5 rounded-full bg-white/80" />
                        </div>

                        {/* Card */}
                        <div className={`mt-4 w-full rounded-2xl border-2 ${borderColors[i]} bg-[#fffaf3] p-4 text-center shadow-sm`}>
                          <p className="text-[11px] font-black uppercase tracking-widest text-[#2a6670]">
                            {event.year}
                          </p>
                          <p className="display-font mt-2 text-base font-bold leading-snug text-[#1f2d39]">
                            {event.title}
                          </p>
                          <p className="mt-2 text-xs leading-relaxed text-[#4f5f69]">
                            {event.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
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
