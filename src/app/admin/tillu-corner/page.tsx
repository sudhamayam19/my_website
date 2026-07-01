import { requireAdmin } from "@/lib/admin-access";
import { TilluCorner } from "@/components/admin/TilluCorner";

export default async function TilluCornerPage() {
  await requireAdmin("/admin/tillu-corner");
  return <TilluCorner />;
}
