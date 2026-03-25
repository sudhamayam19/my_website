import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

function getAuthSecret(): string | null {
  const value = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!value || value.trim().length === 0) {
    return null;
  }
  return value.trim();
}

function getAdminUsername(): string | null {
  const value = process.env.ADMIN_USERNAME;
  if (!value || value.trim().length === 0) {
    return null;
  }
  return value.trim();
}

function getAdminPassword(): string | null {
  const value = process.env.ADMIN_PASSWORD;
  if (!value || value.trim().length === 0) {
    return null;
  }
  return value;
}

function safeEqualText(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

function createSignature(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createAdminSessionToken(username: string): string {
  const secret = getAuthSecret();
  if (!secret) {
    throw new Error("AUTH_SECRET is missing.");
  }

  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${username}.${expiresAt}`;
  const signature = createSignature(payload, secret);
  return `${payload}.${signature}`;
}

function parseAdminSessionToken(token: string): { username: string; expiresAt: number } | null {
  const secret = getAuthSecret();
  if (!secret) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [username, expiresAtRaw, signature] = parts;
  const payload = `${username}.${expiresAtRaw}`;
  const expectedSignature = createSignature(payload, secret);
  if (!safeEqualText(signature, expectedSignature)) {
    return null;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return null;
  }

  return { username, expiresAt };
}

export function validateAdminSessionToken(token: string): boolean {
  return parseAdminSessionToken(token) !== null;
}

export function validateAdminCredentials(username: string, password: string): boolean {
  const expectedUsername = getAdminUsername();
  const expectedPassword = getAdminPassword();

  if (!expectedUsername || !expectedPassword) {
    return false;
  }

  return safeEqualText(username.trim(), expectedUsername) && safeEqualText(password, expectedPassword);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return false;
  }

  return parseAdminSessionToken(token) !== null;
}

export function getAdminSessionCookieName(): string {
  return ADMIN_SESSION_COOKIE;
}

export function getAdminSessionMaxAgeSeconds(): number {
  return SESSION_MAX_AGE_SECONDS;
}
