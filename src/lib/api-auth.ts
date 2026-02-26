import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { isAdminEmail } from "@/lib/authz";

export async function isAdminRequest(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return isAdminEmail(session?.user?.email);
}
