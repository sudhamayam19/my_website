import Link from "next/link";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/site-data";

export interface NavItem {
  label: string;
  href: string;
}

interface SiteHeaderProps {
  navItems: NavItem[];
  activeHref?: string;
  cta?: {
    label: string;
    href: string;
  };
}

export function SiteHeader({ navItems, activeHref, cta }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-[#d8c8b0] bg-[rgba(248,241,231,0.86)] backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="display-font shrink-0 text-xl font-extrabold tracking-[0.04em] text-[#1e4553] sm:text-2xl"
        >
          {SITE_NAME}
        </Link>

        <nav aria-label="Primary" className="min-w-0 flex-1">
          <ul className="flex items-center justify-end gap-1 overflow-x-auto whitespace-nowrap py-1 text-sm font-semibold uppercase tracking-wide text-[#2f3f4e]">
            {navItems.map((item) => {
              const isActive = activeHref === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "rounded-full px-3 py-2 transition-colors",
                      isActive
                        ? "bg-[#1f5562] text-[#f8f1e7]"
                        : "text-[#2f3f4e] hover:bg-[#efe3d1] hover:text-[#214a55]",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            {cta ? (
              <li>
                <Link
                  href={cta.href}
                  className="ml-1 rounded-full border border-[#c9a783] bg-[#b6563f] px-4 py-2 text-white transition hover:bg-[#9f4936]"
                >
                  {cta.label}
                </Link>
              </li>
            ) : null}
          </ul>
        </nav>
      </div>
    </header>
  );
}
