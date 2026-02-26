import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { isAdminEmail } from "@/lib/authz";

export async function requireAdmin(callbackPath: string) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }

  return session;
}
