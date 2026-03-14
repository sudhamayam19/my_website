import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/simple-auth";

export async function requireAdmin(callbackPath: string) {
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }

  return { isAdmin: true };
}
