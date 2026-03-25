import { isAdminAuthenticated, validateAdminSessionToken } from "@/lib/simple-auth";

function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
}

export async function isAdminRequest(request?: Request): Promise<boolean> {
  if (request) {
    const bearerToken = getBearerToken(request);
    if (bearerToken) {
      return validateAdminSessionToken(bearerToken);
    }
  }

  return await isAdminAuthenticated();
}
