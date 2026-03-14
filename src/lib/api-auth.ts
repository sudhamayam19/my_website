import { isAdminAuthenticated } from "@/lib/simple-auth";

export async function isAdminRequest(): Promise<boolean> {
  return await isAdminAuthenticated();
}
