import { getBlogNav } from "@/components/AuthNav";
import { BlogSearch } from "@/components/BlogSearch";
import { NewsletterForm } from "@/components/NewsletterForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getBlogCategories, getBlogPosts } from "@/lib/content-store";
import { isAdminAuthenticated } from "@/lib/simple-auth";

export default async function BlogPage() {
  const blogNav = await getBlogNav();
  const posts = await getBlogPosts();
  const categories = await getBlogCategories();
  const showAdminAccess = await isAdminAuthenticated();

  return (
    <div className="page-shell">
      <SiteHeader
        navItems={blogNav}
        activeHref="/blog"
        cta={showAdminAccess ? { label: "Admin", href: "/admin" } : undefined}
      />

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
            <BlogSearch posts={posts} categories={categories} />
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
