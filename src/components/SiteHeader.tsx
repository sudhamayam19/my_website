"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/site-data";
import { SearchModal } from "@/components/SearchModal";

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Don't let the page scroll behind an open mobile menu
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#d8c8b0] bg-[rgba(248,241,231,0.86)] backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="display-font min-w-0 truncate text-xl font-extrabold tracking-[0.04em] text-[#1e4553] sm:text-2xl"
          >
            {SITE_NAME}
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Primary" className="hidden min-w-0 flex-1 lg:block">
            <ul className="flex items-center justify-end gap-1 whitespace-nowrap py-1 text-sm font-semibold uppercase tracking-wide text-[#2f3f4e]">
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

              <li>
                <button
                  onClick={() => setSearchOpen(true)}
                  className="rounded-full p-2 text-[#2f3f4e] transition-colors hover:bg-[#efe3d1] hover:text-[#214a55]"
                  aria-label="Search"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                </button>
              </li>

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

          {/* Mobile controls */}
          <div className="flex shrink-0 items-center gap-1 lg:hidden">
            <button
              onClick={() => setSearchOpen(true)}
              className="rounded-full p-2 text-[#2f3f4e] transition-colors hover:bg-[#efe3d1]"
              aria-label="Search"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </button>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded-full p-2 text-[#2f3f4e] transition-colors hover:bg-[#efe3d1]"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M3 6h18M3 12h18M3 18h18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {menuOpen && (
          <nav
            aria-label="Mobile"
            className="border-t border-[#d8c8b0] bg-[#f8f1e7] lg:hidden"
          >
            <ul className="max-h-[calc(100vh-4rem)] overflow-y-auto px-4 py-3">
              {navItems.map((item) => {
                const isActive = activeHref === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "block rounded-xl px-4 py-3 text-base font-semibold transition-colors",
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
                <li className="mt-2">
                  <Link
                    href={cta.href}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-xl bg-[#b6563f] px-4 py-3 text-center text-base font-semibold text-white transition hover:bg-[#9f4936]"
                  >
                    {cta.label}
                  </Link>
                </li>
              ) : null}
            </ul>
          </nav>
        )}
      </header>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}
