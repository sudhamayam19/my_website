import { isAdminAuthenticated } from "@/lib/simple-auth";
import { redirect } from "next/navigation";
import { MediaAdmin } from "@/components/admin/MediaAdmin";

export default async function AdminMediaPage() {
  if (!await isAdminAuthenticated()) redirect("/admin/login");
  return <MediaAdmin />;
}
