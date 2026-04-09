import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/api-auth";
import { getDailyDose, saveDailyDose } from "@/lib/content-store";

function parsePayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const raw = payload as Record<string, unknown>;
  const text = typeof raw.text === "string" ? raw.text : "";
  const author = typeof raw.author === "string" ? raw.author : undefined;
  const active = Boolean(raw.active);
  const style = raw.style === "flash" ? "flash" : "scroll";

  return {
    text,
    author,
    active,
    style,
  } as const;
}

export async function GET(request: Request) {
  const isAdmin = await isAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const dose = await getDailyDose();
    return NextResponse.json({ dose });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load Daily Dose." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const isAdmin = await isAdminRequest(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const payload = parsePayload(await request.json());
    if (!payload) {
      return NextResponse.json({ error: "Invalid Daily Dose payload." }, { status: 400 });
    }

    const dose = await saveDailyDose(payload);
    return NextResponse.json({ dose });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save Daily Dose." },
      { status: 500 },
    );
  }
}
