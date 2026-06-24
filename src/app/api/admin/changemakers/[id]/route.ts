import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/api-auth";
import { deleteChangeMaker } from "@/lib/content-store";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await deleteChangeMaker(id);
  return NextResponse.json({ ok: true });
}
