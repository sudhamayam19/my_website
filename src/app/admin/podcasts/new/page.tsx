import { PodcastEditor } from "@/components/admin/PodcastEditor";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { requireAdmin } from "@/lib/admin-access";

const adminNav = [
  { label: "Home", href: "/" },
  { label: "Blog", href: "/blog" },
  { label: "Podcasts", href: "/podcasts" },
  { label: "Admin", href: "/admin" },
];

export default async function NewPodcastPage() {
  await requireAdmin("/admin/podcasts/new");

  return (
    <div className="page-shell">
      <SiteHeader navItems={adminNav} activeHref="/admin" />

      <main className="page-inner px-4 pb-10 pt-12 sm:px-6 lg:px-8">
        <PodcastEditor mode="create" />
      </main>

      <SiteFooter />
    </div>
  );
}
