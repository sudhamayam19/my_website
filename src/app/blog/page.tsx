import Link from "next/link";
import { getBlogNav } from "@/components/AuthNav";
import { NewsletterForm } from "@/components/NewsletterForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getBlogCategories, getBlogPosts } from "@/lib/content-store";
import { formatDisplayDate } from "@/lib/site-data";

export default async function BlogPage() {
  const blogNav = await getBlogNav();
  const posts = await getBlogPosts();
  const categories = await getBlogCategories();

  return (
    <div className="page-shell">
      <SiteHeader navItems={blogNav} activeHref="/blog" cta={{ label: "Admin", href: "/admin" }} />

      <main className="page-inner px-4 pb-10 pt-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <section className="editorial-card p-8 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2a6670]">
              Editorial Notes
            </p>
            <h1 className="display-font mt-3 text-5xl font-bold text-[#1f2d39] sm:text-6xl">
              Blog
            </h1>
            <p className="mt-4 max-w-2xl text-[#4f5f69]">
              Explore published posts managed from the admin dashboard and stored in Convex.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {categories.map((category) => (
                <span key={category} className="editorial-chip">
                  {category}
                </span>
              ))}
            </div>
          </section>

          <section className="mt-10">
            {posts.length ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {posts.map((post) => (
                  <article
                    key={post.id}
                    className="editorial-card overflow-hidden transition hover:-translate-y-1"
                  >
                    <div className={`h-44 bg-gradient-to-br ${post.coverGradient}`} />
                    <div className="p-6">
                      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                        <span className="editorial-chip">{post.category}</span>
                        <span className="text-[#5f6f79]">
                          {formatDisplayDate(post.publishedAt)}
                        </span>
                        <span className="text-[#5f6f79]">{post.readTimeMinutes} min read</span>
                      </div>

                      <h2 className="display-font text-3xl font-bold text-[#1f2d39]">
                        {post.title}
                      </h2>
                      <p className="mt-3 text-sm leading-relaxed text-[#4f5f69]">{post.excerpt}</p>

                      <Link href={`/blog/${post.id}`} className="editorial-btn-secondary mt-5">
                        Read post
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-[#c8b397] bg-[#fff9ef] px-6 py-10 text-[#50616d]">
                No posts found.
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
