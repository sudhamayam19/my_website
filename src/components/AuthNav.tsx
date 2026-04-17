import type { NavItem } from "@/components/SiteHeader";
import { isAdminAuthenticated } from "@/lib/simple-auth";

interface NavOptions {
  includeJourney?: boolean;
  includeMedia?: boolean;
  includeBlog?: boolean;
  includePodcasts?: boolean;
}

export async function getHomeNav(options?: NavOptions): Promise<NavItem[]> {
  const showAdmin = await isAdminAuthenticated();

  const items: NavItem[] = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
  ];
  if (options?.includeJourney) {
    items.push({ label: "Journey", href: "/#journey" });
  }
  if (options?.includeMedia) {
    items.push({ label: "Media", href: "/#media" });
  }
  if (options?.includeBlog ?? true) {
    items.push({ label: "Blog", href: "/blog" });
  }
  if (options?.includePodcasts ?? true) {
    items.push({ label: "Podcasts", href: "/podcasts" });
  }
  items.push({ label: "Contact", href: "/contact" });
  if (showAdmin) {
    items.push({ label: "Admin", href: "/admin" });
  }

  return items;
}

export async function getBlogNav(): Promise<NavItem[]> {
  return getHomeNav({ includeBlog: true });
}

export async function getPodcastNav(): Promise<NavItem[]> {
  return getHomeNav({ includePodcasts: true });
}
