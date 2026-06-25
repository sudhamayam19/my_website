import { requireAdmin } from "@/lib/admin-access";
import { TilluWebChat } from "@/components/admin/TilluWebChat";

export default async function TilluPage() {
  await requireAdmin("/admin/tillu");
  return <TilluWebChat />;
}
