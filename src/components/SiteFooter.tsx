import Link from "next/link";
import { PlatformIcon } from "@/components/PlatformIcon";
import { SITE_NAME, SITE_TAGLINE, socialLinks } from "@/lib/site-data";

const footerNav = [
  { label: "Home", href: "/" },
  { label: "Blog", href: "/blog" },
  { label: "Admin", href: "/admin" },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-[#c8b397] bg-[#1e2d39] px-4 py-12 text-[#e9ddcd] sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-10 md:grid-cols-3">
        <div>
          <h3 className="display-font text-3xl font-bold text-[#f6ebd7]">
            {SITE_NAME}
          </h3>
          <p className="mt-3 text-sm text-[#d4c5b1]">{SITE_TAGLINE}</p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f0dfc5]">
            Quick Links
          </h4>
          <ul className="mt-3 space-y-2">
            {footerNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-[#d4c5b1] transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f0dfc5]">
            Connect
          </h4>
          <div className="mt-3 flex items-center gap-3">
            {socialLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#816857] bg-[#1d3b46] text-[#e9ddcd] transition hover:border-[#d2b48f] hover:bg-[#2c5560] hover:text-white"
                title={link.label}
                aria-label={link.label}
              >
                <PlatformIcon platformId={link.id} className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 w-full max-w-7xl border-t border-[#3b4b57] pt-6 text-sm text-[#b7ab9e]">
        <p>{new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
      </div>
    </footer>
  );
}
