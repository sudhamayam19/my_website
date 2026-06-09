import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/api-auth";
import { deleteMediaAppearance } from "@/lib/content-store";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const { id } = await params;
    await deleteMediaAppearance(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed." }, { status: 500 });
  }
}
