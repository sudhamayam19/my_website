import { getDosePool } from "@/lib/content-store";
import { RotatingDose } from "./RotatingDose";

export async function DailyDoseBanner() {
  const doses = await getDosePool();
  if (doses.length === 0) return null;
  return <RotatingDose doses={doses} />;
}
