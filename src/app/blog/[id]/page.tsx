import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogNav } from "@/components/AuthNav";
import { CommentsSection } from "@/components/CommentsSection";
import { ShareButtons } from "@/components/ShareButtons";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import {
  formatDisplayDate,
  getBlogPostById,
  getBlogPosts,
  getCommentsByPostId,
} from "@/lib/site-data";

interface BlogPostPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { id } = await params;
  const post = getBlogPostById(id);

  if (!post) {
    return {
      title: "Post Not Found | Sudha Devarakonda",
      description: "Requested blog post does not exist.",
    };
  }

  return {
    title: `${post.title} | Sudha Devarakonda`,
    description: post.seoDescription,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const blogNav = await getBlogNav();
  const { id } = await params;
  const post = getBlogPostById(id);

  if (!post || post.status !== "published") {
    notFound();
  }

  const comments = getCommentsByPostId(post.id);
  const relatedPosts = getBlogPosts()
    .filter((item) => item.id !== post.id)
    .slice(0, 3);

  return (
    <div className="page-shell">
      <SiteHeader navItems={blogNav} activeHref="/blog" cta={{ label: "Admin", href: "/admin" }} />

      <main className="page-inner px-4 pb-10 pt-12 sm:px-6 lg:px-8">
        <article className="mx-auto max-w-4xl">
          <Link href="/blog" className="editorial-btn-secondary">
            Back to Blog
          </Link>

          <header className="editorial-card mt-6 overflow-hidden">
            <div className={`h-52 bg-gradient-to-br ${post.coverGradient}`} />
            <div className="p-8">
              <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                <span className="editorial-chip">{post.category}</span>
                <span className="text-[#5f6f79]">{formatDisplayDate(post.publishedAt)}</span>
                <span className="text-[#5f6f79]">{post.readTimeMinutes} min read</span>
              </div>
              <h1 className="display-font text-4xl font-extrabold leading-tight text-[#1f2d39] sm:text-5xl">
                {post.title}
              </h1>
              <p className="mt-4 text-[#4f5f69]">{post.excerpt}</p>
            </div>
          </header>

          <section className="editorial-card mt-8 p-8 sm:p-10">
            <div className="space-y-5 text-base leading-relaxed text-[#42555f]">
              {post.content.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <ShareButtons />
            <CommentsSection postId={post.id} initialComments={comments} />
          </section>

          <section className="editorial-card mt-10 p-8">
            <h2 className="display-font text-3xl font-bold text-[#1f2d39]">Related Posts</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {relatedPosts.map((item) => (
                <Link
                  key={item.id}
                  href={`/blog/${item.id}`}
                  className="rounded-2xl border border-[#d5c3ab] bg-[#fcf6eb] p-4 transition hover:border-[#b89572] hover:bg-[#f9eedf]"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2a6670]">
                    {item.category}
                  </p>
                  <p className="display-font mt-2 text-2xl font-semibold text-[#1f2d39]">
                    {item.title}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
