import { getServerSession } from "next-auth";
import { isAdminEmail } from "@/lib/authz";
import { authOptions } from "@/lib/auth-options";
import type { NavItem } from "@/components/SiteHeader";

interface NavOptions {
  includeJourney?: boolean;
  includeMedia?: boolean;
  includeBlog?: boolean;
}

export async function getHomeNav(options?: NavOptions): Promise<NavItem[]> {
  const session = await getServerSession(authOptions);
  const showAdmin = isAdminEmail(session?.user?.email);

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
