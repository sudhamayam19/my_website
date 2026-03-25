import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/api-auth";
import { getMobileDashboardData } from "@/lib/mobile-admin-data";

export async function GET(request: Request) {
  const isAdmin = await isAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const data = await getMobileDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load dashboard.",
      },
      { status: 500 },
    );
  }
}
