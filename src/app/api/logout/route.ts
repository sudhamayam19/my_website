import { NextResponse } from "next/server";
import { getAdminSessionCookieName } from "@/lib/simple-auth";

function clearSessionAndRedirect(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(getAdminSessionCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function POST(request: Request) {
  return clearSessionAndRedirect(request);
}

export async function GET(request: Request) {
  return clearSessionAndRedirect(request);
}
