import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getHomeNav } from "@/components/AuthNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { authOptions } from "@/lib/auth-options";
import { isAdminEmail } from "@/lib/authz";

interface LoginPageProps {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
  }>;
}

function safeCallbackPath(value?: string): string {
  if (!value) {
    return "/admin";
  }
  return value.startsWith("/") ? value : "/admin";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const callbackPath = safeCallbackPath(params.callbackUrl);
  const session = await getServerSession(authOptions);
  const navItems = await getHomeNav({ includeBlog: true });

  if (isAdminEmail(session?.user?.email)) {
    redirect(callbackPath);
  }

  const googleSignInUrl = `/api/auth/signin/google?callbackUrl=${encodeURIComponent(
    callbackPath,
  )}`;

  return (
    <div className="page-shell">
      <SiteHeader navItems={navItems} />

      <main className="page-inner px-4 pb-10 pt-16 sm:px-6 lg:px-8">
        <div className="editorial-card mx-auto max-w-2xl p-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2a6670]">
            Restricted Area
          </p>
          <h1 className="display-font mt-3 text-4xl font-bold text-[#1f2d39]">
            Admin Login
          </h1>
          <p className="mt-4 text-[#4f5f69]">
            Sign in with your authorized Google account to access the admin panel.
          </p>

          {params.error === "AccessDenied" ? (
            <p className="mt-4 text-sm font-semibold text-[#a63d2d]">
              This email is not allowed to access admin.
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href={googleSignInUrl} className="editorial-btn-primary">
              Continue with Google
            </a>
            <Link href="/" className="editorial-btn-secondary">
              Back Home
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
