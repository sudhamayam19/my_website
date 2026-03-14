import Link from "next/link";
import { redirect } from "next/navigation";
import { getHomeNav } from "@/components/AuthNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { isAdminAuthenticated } from "@/lib/simple-auth";

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

function getErrorMessage(error?: string): string | null {
  if (error === "invalid_credentials") {
    return "Invalid username or password.";
  }
  if (error === "auth_config") {
    return "Admin credentials are not configured on the server.";
  }
  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const callbackPath = safeCallbackPath(params.callbackUrl);
  const navItems = await getHomeNav({ includeBlog: true });
  const showError = getErrorMessage(params.error);

  if (await isAdminAuthenticated()) {
    redirect(callbackPath);
  }

  return (
    <div className="page-shell">
      <SiteHeader navItems={navItems} />

      <main className="page-inner px-4 pb-10 pt-16 sm:px-6 lg:px-8">
        <div className="editorial-card mx-auto max-w-2xl p-10">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-[#2a6670]">
            Restricted Area
          </p>
          <h1 className="display-font mt-3 text-center text-4xl font-bold text-[#1f2d39]">
            Admin Login
          </h1>
          <p className="mt-4 text-center text-[#4f5f69]">
            Sign in with your admin username and password.
          </p>

          {showError ? (
            <p className="mt-4 text-center text-sm font-semibold text-[#a63d2d]">{showError}</p>
          ) : null}

          <form action="/api/login" method="post" className="mx-auto mt-8 max-w-md space-y-4">
            <input type="hidden" name="callbackUrl" value={callbackPath} />

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#304b57]">Username</span>
              <input
                name="username"
                type="text"
                required
                className="w-full rounded-xl border border-[#c8b397] bg-[#fffefb] px-4 py-3 text-sm outline-none ring-[#2a6670] transition focus:ring"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#304b57]">Password</span>
              <input
                name="password"
                type="password"
                required
                className="w-full rounded-xl border border-[#c8b397] bg-[#fffefb] px-4 py-3 text-sm outline-none ring-[#2a6670] transition focus:ring"
              />
            </label>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button type="submit" className="editorial-btn-primary">
                Sign in
              </button>
              <Link href="/" className="editorial-btn-secondary">
                Back Home
              </Link>
            </div>
          </form>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
