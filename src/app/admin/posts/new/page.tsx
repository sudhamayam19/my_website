import { PostEditor } from "@/components/admin/PostEditor";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { requireAdmin } from "@/lib/admin-access";

const adminNav = [
  { label: "Home", href: "/" },
  { label: "Blog", href: "/blog" },
  { label: "Admin", href: "/admin" },
];

export default async function NewPostPage() {
  await requireAdmin("/admin/posts/new");
  return (
    <div className="page-shell">
      <SiteHeader navItems={adminNav} activeHref="/admin" />

      <main className="page-inner px-4 pb-10 pt-12 sm:px-6 lg:px-8">
        <PostEditor mode="create" />
      </main>

      <SiteFooter />
    </div>
  );
}
