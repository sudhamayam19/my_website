import { requireAdmin } from "@/lib/admin-access";
import { DiscussionsAdmin } from "@/components/admin/DiscussionsAdmin";

export default async function AdminDiscussionsPage() {
  await requireAdmin("/admin/discussions");
  return <DiscussionsAdmin />;
}
