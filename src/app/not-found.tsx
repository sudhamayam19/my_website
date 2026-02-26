import Link from "next/link";
import { getBlogNav } from "@/components/AuthNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default async function NotFoundPage() {
  const navItems = await getBlogNav();
  return (
    <div className="page-shell">
      <SiteHeader navItems={navItems} />

      <main className="page-inner px-4 pb-10 pt-16 sm:px-6 lg:px-8">
        <div className="editorial-card mx-auto max-w-2xl p-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#2a6670]">
            Error 404
          </p>
          <h1 className="display-font mt-3 text-4xl font-extrabold text-[#1f2d39]">Page not found</h1>
          <p className="mt-4 text-[#4f5f69]">
            The page you requested does not exist or is not published.
          </p>
          <div className="mt-7 flex justify-center gap-3">
            <Link href="/" className="editorial-btn-primary">
              Go Home
            </Link>
            <Link href="/blog" className="editorial-btn-secondary">
              Browse Blog
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
