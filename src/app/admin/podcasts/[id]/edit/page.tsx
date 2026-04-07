import { notFound } from "next/navigation";
import { PodcastEditor } from "@/components/admin/PodcastEditor";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { requireAdmin } from "@/lib/admin-access";
import { getPodcastEpisodeById } from "@/lib/content-store";

const adminNav = [
  { label: "Home", href: "/" },
  { label: "Blog", href: "/blog" },
  { label: "Podcasts", href: "/podcasts" },
  { label: "Admin", href: "/admin" },
];

interface EditPodcastPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPodcastPage({ params }: EditPodcastPageProps) {
  const { id } = await params;
  await requireAdmin(`/admin/podcasts/${id}/edit`);
  const episode = await getPodcastEpisodeById(id);

  if (!episode) {
    notFound();
  }

  return (
    <div className="page-shell">
      <SiteHeader navItems={adminNav} activeHref="/admin" />

      <main className="page-inner px-4 pb-10 pt-12 sm:px-6 lg:px-8">
        <PodcastEditor mode="edit" initialEpisode={episode} />
      </main>

      <SiteFooter />
    </div>
  );
}
