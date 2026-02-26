import Link from "next/link";
import { AdminSessionControls } from "@/components/admin/AdminSessionControls";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { requireAdmin } from "@/lib/admin-access";
import { formatDisplayDate, getAdminStats, getBlogPosts } from "@/lib/site-data";

const adminNav = [
  { label: "Home", href: "/" },
  { label: "Blog", href: "/blog" },
  { label: "Admin", href: "/admin" },
];

export default async function AdminDashboardPage() {
  await requireAdmin("/admin");
  const stats = getAdminStats();
  const posts = getBlogPosts({ includeDrafts: true });

  return (
    <div className="page-shell">
      <SiteHeader navItems={adminNav} activeHref="/admin" cta={{ label: "New Post", href: "/admin/posts/new" }} />

      <main className="page-inner px-4 pb-10 pt-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <section className="editorial-card p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2a6670]">
                  Control Room
                </p>
                <h1 className="display-font mt-2 text-5xl font-extrabold text-[#1f2d39] sm:text-6xl">
                  Admin Dashboard
                </h1>
                <p className="mt-3 max-w-2xl text-[#4f5f69]">
                  The management interface is production-ready on the frontend and now matches the public editorial design system.
                </p>
              </div>
              <AdminSessionControls />
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-[#d3c1a8] bg-[#fcf5ea] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5f6f79]">
                  Total Posts
                </p>
                <p className="display-font mt-2 text-4xl font-bold text-[#1f2d39]">{stats.totalPosts}</p>
              </div>
              <div className="rounded-2xl border border-[#d3c1a8] bg-[#fcf5ea] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5f6f79]">
                  Published
                </p>
                <p className="display-font mt-2 text-4xl font-bold text-[#1f2d39]">{stats.publishedPosts}</p>
              </div>
              <div className="rounded-2xl border border-[#d3c1a8] bg-[#fcf5ea] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5f6f79]">
                  Comments
                </p>
                <p className="display-font mt-2 text-4xl font-bold text-[#1f2d39]">{stats.totalComments}</p>
              </div>
              <div className="rounded-2xl border border-[#d3c1a8] bg-[#fcf5ea] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5f6f79]">
                  Categories
                </p>
                <p className="display-font mt-2 text-4xl font-bold text-[#1f2d39]">{stats.categories}</p>
              </div>
            </div>
          </section>

          <section className="editorial-card mt-8 p-6 sm:p-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="display-font text-4xl font-bold text-[#1f2d39]">Posts</h2>
              <Link href="/admin/posts/new" className="editorial-btn-primary">
                Create Post
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#d8c8b0] text-[#61727d]">
                    <th className="pb-3 font-semibold">Title</th>
                    <th className="pb-3 font-semibold">Category</th>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id} className="border-b border-[#eadfcd]">
                      <td className="py-4 font-medium text-[#1e2f3b]">{post.title}</td>
                      <td className="py-4 text-[#4e5f69]">{post.category}</td>
                      <td className="py-4 text-[#4e5f69]">{formatDisplayDate(post.publishedAt)}</td>
                      <td className="py-4">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            post.status === "published"
                              ? "bg-[#dceee7] text-[#1f6667]"
                              : "bg-[#f2e6cf] text-[#8d6330]"
                          }`}
                        >
                          {post.status}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/blog/${post.id}`}
                            className="rounded-full border border-[#c7b294] px-3 py-1 text-xs font-semibold text-[#2f3f4e] transition hover:bg-[#f6efe3]"
                          >
                            View
                          </Link>
                          <Link
                            href={`/admin/posts/${post.id}/edit`}
                            className="rounded-full border border-[#b98d67] px-3 py-1 text-xs font-semibold text-[#2a6670] transition hover:bg-[#f6efe3]"
                          >
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
