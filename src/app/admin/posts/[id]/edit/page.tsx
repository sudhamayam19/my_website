import { notFound } from "next/navigation";
import { PostEditor } from "@/components/admin/PostEditor";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { requireAdmin } from "@/lib/admin-access";
import { getBlogPostById } from "@/lib/content-store";

const adminNav = [
  { label: "Home", href: "/" },
  { label: "Blog", href: "/blog" },
  { label: "Admin", href: "/admin" },
];

interface EditPostPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  await requireAdmin(`/admin/posts/${id}/edit`);
  const post = await getBlogPostById(id);

  if (!post) {
    notFound();
  }

  return (
    <div className="page-shell">
      <SiteHeader navItems={adminNav} activeHref="/admin" />

      <main className="page-inner px-4 pb-10 pt-12 sm:px-6 lg:px-8">
        <PostEditor mode="edit" initialPost={post} />
      </main>

      <SiteFooter />
    </div>
  );
}
