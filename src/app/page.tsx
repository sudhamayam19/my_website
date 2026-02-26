import Link from "next/link";
import { getHomeNav } from "@/components/AuthNav";
import { NewsletterForm } from "@/components/NewsletterForm";
import { PlatformIcon } from "@/components/PlatformIcon";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TimelineMilestoneCard } from "@/components/TimelineMilestoneCard";
import {
  formatDisplayDate,
  getFeaturedPosts,
  mediaCards,
  timelineEvents,
} from "@/lib/site-data";

export default async function HomePage() {
  const homeNav = await getHomeNav({ includeJourney: true, includeMedia: true, includeBlog: true });
  const featuredPosts = getFeaturedPosts(3);

  return (
    <div className="page-shell">
      <SiteHeader navItems={homeNav} activeHref="/" />

      <main className="page-inner">
        <section className="px-4 pb-16 pt-14 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <article className="editorial-hero p-9 sm:p-12">
              <p className="editorial-hero-tag">Voice, translation, storytelling</p>
              <h1 className="display-font mt-6 max-w-3xl text-5xl font-bold leading-tight text-[#1d2d3c] sm:text-6xl">
                A crafted voice across radio, podcasts, and language.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#4f5f69]">
                This is a design-forward frontend build prepared for backend integration.
                The content layer, admin interface, and comment flow are all in place for
                a clean Convex connection.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/blog" className="editorial-btn-primary">
                  Read the blog
                </Link>
                <Link href="/admin" className="editorial-btn-secondary">
                  Open admin
                </Link>
              </div>
            </article>

            <aside className="editorial-card editorial-lift p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2a6670]">
                Current focus
              </p>
              <h2 className="display-font mt-3 text-3xl font-bold text-[#1f2d39]">
                Building a durable media archive
              </h2>
              <ul className="mt-6 space-y-4 text-sm text-[#445963]">
                <li className="rounded-xl border border-[#d8c8b0] bg-[#fbf4e7] p-4">
                  Structured post metadata and reusable page blocks.
                </li>
                <li className="rounded-xl border border-[#d8c8b0] bg-[#fbf4e7] p-4">
                  Admin drafting and editing UI prepared for backend hooks.
                </li>
                <li className="rounded-xl border border-[#d8c8b0] bg-[#fbf4e7] p-4">
                  Comment section interactions ready for real persistence.
                </li>
              </ul>
            </aside>
          </div>
        </section>

        <section id="journey" className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2a6670]">
                Career Timeline
              </p>
              <h2 className="display-font mt-2 text-4xl font-bold text-[#1f2d39] sm:text-5xl">
                A voice career in milestones
              </h2>
              <p className="mt-3 text-[#4f5f69]">
                Placeholder image frames are intentionally designed and can be replaced with real photos later.
              </p>
            </div>

            <div className="space-y-5">
              {timelineEvents.map((event) => (
                <TimelineMilestoneCard key={`${event.year}-${event.title}`} event={event} />
              ))}
            </div>
          </div>
        </section>

        <section id="media" className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10">
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
                  <div
                    className={`relative flex h-36 items-center justify-center bg-gradient-to-br ${card.gradientClass} text-white`}
                  >
                    <PlatformIcon platformId={card.id} className="h-16 w-16" />
                  </div>
                  <div className="p-6">
                    <h3 className="display-font text-3xl font-bold text-[#1f2d39]">
                      {card.platform}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#4f5f69]">
                      {card.description}
                    </p>
                    <a
                      href={card.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="editorial-btn-secondary mt-5"
                    >
                      {card.buttonLabel}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2a6670]">
                  Featured Writing
                </p>
                <h2 className="display-font mt-2 text-4xl font-bold text-[#1f2d39] sm:text-5xl">
                  Recent posts
                </h2>
              </div>
              <Link href="/blog" className="editorial-btn-secondary">
                View all posts
              </Link>
            </div>

            {featuredPosts.length ? (
              <div className="grid gap-6 md:grid-cols-3">
                {featuredPosts.map((post) => (
                  <Link key={post.id} href={`/blog/${post.id}`} className="group block">
                    <article className="editorial-card overflow-hidden transition group-hover:-translate-y-1">
                      <div className={`h-44 bg-gradient-to-br ${post.coverGradient}`} />
                      <div className="p-6">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                          <span className="editorial-chip">{post.category}</span>
                          <span className="text-[#5f6f79]">
                            {formatDisplayDate(post.publishedAt)}
                          </span>
                        </div>
                        <h3 className="display-font mt-4 text-3xl font-bold text-[#1f2d39]">
                          {post.title}
                        </h3>
                        <p className="mt-3 text-sm leading-relaxed text-[#4f5f69]">
                          {post.excerpt}
                        </p>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-[#c8b397] bg-[#fff9ef] px-6 py-8 text-[#50616d]">
                No featured posts yet.
              </p>
            )}
          </div>
        </section>

        <section className="px-4 pb-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <NewsletterForm />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
