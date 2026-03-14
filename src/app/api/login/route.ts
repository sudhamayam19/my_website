import { NextResponse } from "next/server";
import {
  createAdminSessionToken,
  getAdminSessionCookieName,
  getAdminSessionMaxAgeSeconds,
  validateAdminCredentials,
} from "@/lib/simple-auth";

function safeCallbackPath(value: FormDataEntryValue | null): string {
  if (typeof value !== "string" || value.length === 0) {
    return "/admin";
  }
  return value.startsWith("/") ? value : "/admin";
}

function redirectToLogin(request: Request, callbackPath: string, error: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("callbackUrl", callbackPath);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const callbackPath = safeCallbackPath(formData.get("callbackUrl"));
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!validateAdminCredentials(username, password)) {
    return redirectToLogin(request, callbackPath, "invalid_credentials");
  }

  let token = "";
  try {
    token = createAdminSessionToken(username.trim());
  } catch {
    return redirectToLogin(request, callbackPath, "auth_config");
  }

  const response = NextResponse.redirect(new URL(callbackPath, request.url));
  response.cookies.set(getAdminSessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: getAdminSessionMaxAgeSeconds(),
  });
  return response;
}
