import { getHomeNav } from "@/components/AuthNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE_NAME } from "@/lib/site-data";

export default async function PrivacyPolicyPage() {
  const navItems = await getHomeNav({ includeJourney: true, includeMedia: true });

  return (
    <div className="page-shell">
      <SiteHeader navItems={navItems} activeHref="/privacy-policy" />

      <main className="page-inner px-4 pb-10 pt-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <section className="editorial-card p-8 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2a6670]">
              Privacy Policy
            </p>
            <h1 className="display-font mt-3 text-5xl font-bold text-[#1f2d39] sm:text-6xl">
              Privacy Policy
            </h1>
            <p className="mt-5 text-base leading-relaxed text-[#4f5f69] sm:text-lg">
              This privacy policy explains what information {SITE_NAME} may collect through this
              website and how that information is used.
            </p>
          </section>

          <section className="editorial-card space-y-6 p-6 sm:p-8">
            <article>
              <h2 className="display-font text-3xl font-bold text-[#1f2d39]">Information you provide</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#4f5f69]">
                If you submit a comment or subscribe to updates, you may provide information such
                as your name, email address, or message content. This information is used only to
                operate the site, publish comments when appropriate, and manage subscriptions.
              </p>
            </article>

            <article>
              <h2 className="display-font text-3xl font-bold text-[#1f2d39]">Analytics and usage data</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#4f5f69]">
                This site may collect basic analytics such as page views and content engagement in
                order to understand which articles and podcast pages are useful to visitors.
              </p>
            </article>

            <article>
              <h2 className="display-font text-3xl font-bold text-[#1f2d39]">Cookies</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#4f5f69]">
                Cookies or similar technologies may be used for site functionality, analytics, and
                advertising support if ads are enabled in the future.
              </p>
            </article>

            <article>
              <h2 className="display-font text-3xl font-bold text-[#1f2d39]">Third-party services</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#4f5f69]">
                The site may link to third-party platforms such as Spotify, YouTube, Instagram, or
                newsletter and analytics providers. Their privacy practices are governed by their own
                policies.
              </p>
            </article>

            <article>
              <h2 className="display-font text-3xl font-bold text-[#1f2d39]">Policy updates</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#4f5f69]">
                This policy may be updated from time to time as the site grows and adds features.
              </p>
            </article>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
