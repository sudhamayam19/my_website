import { isAdminAuthenticated } from "@/lib/simple-auth";
import { redirect } from "next/navigation";
import { ChangeMakersAdmin } from "@/components/admin/ChangeMakersAdmin";

export default async function AdminChangeMakersPage() {
  if (!await isAdminAuthenticated()) redirect("/admin/login");
  return <ChangeMakersAdmin />;
}
