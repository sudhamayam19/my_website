import Link from "next/link";
import { getHomeNav } from "@/components/AuthNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { socialLinks } from "@/lib/site-data";

export default async function ContactPage() {
  const navItems = await getHomeNav({ includeJourney: true, includeMedia: true });

  return (
    <div className="page-shell">
      <SiteHeader navItems={navItems} activeHref="/contact" />

      <main className="page-inner px-4 pb-10 pt-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-8">
          <section className="editorial-card p-8 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2a6670]">
              Contact
            </p>
            <h1 className="display-font mt-3 text-5xl font-bold text-[#1f2d39] sm:text-6xl">
              Get in touch
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-[#4f5f69] sm:text-lg">
              For collaborations, media conversations, translations, voice work, or podcast-related
              enquiries, use the official social profiles linked below. This page exists to help
              visitors and partners reach Sudha through her public channels.
            </p>
          </section>

          <section className="grid gap-6 md:grid-cols-3">
            {socialLinks.map((link) => (
              <article key={link.id} className="editorial-card p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2a6670]">
                  {link.label}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#4f5f69]">
                  Reach out through the official {link.label} profile.
                </p>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="editorial-btn-secondary mt-5"
                >
                  Open {link.label}
                </a>
              </article>
            ))}
          </section>

          <section className="editorial-card p-6">
            <h2 className="display-font text-3xl font-bold text-[#1f2d39]">Useful links</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/about" className="editorial-btn-secondary">
                About
              </Link>
              <Link href="/blog" className="editorial-btn-secondary">
                Blog
              </Link>
              <Link href="/podcasts" className="editorial-btn-secondary">
                Podcasts
              </Link>
              <Link href="/privacy-policy" className="editorial-btn-secondary">
                Privacy Policy
              </Link>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
