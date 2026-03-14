import type { NavItem } from "@/components/SiteHeader";
import { isAdminAuthenticated } from "@/lib/simple-auth";

interface NavOptions {
  includeJourney?: boolean;
  includeMedia?: boolean;
  includeBlog?: boolean;
}

export async function getHomeNav(options?: NavOptions): Promise<NavItem[]> {
  const showAdmin = await isAdminAuthenticated();

  const items: NavItem[] = [{ label: "Home", href: "/" }];
  if (options?.includeJourney) {
    items.push({ label: "Journey", href: "/#journey" });
  }
  if (options?.includeMedia) {
    items.push({ label: "Media", href: "/#media" });
  }
  if (options?.includeBlog ?? true) {
    items.push({ label: "Blog", href: "/blog" });
  }
  if (showAdmin) {
    items.push({ label: "Admin", href: "/admin" });
  }

  return items;
}

export async function getBlogNav(): Promise<NavItem[]> {
  return getHomeNav({ includeBlog: true });
}
