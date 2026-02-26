export function getAdminEmail(): string | null {
  const value = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return value && value.length > 0 ? value : null;
}

export function isAdminEmail(email?: string | null): boolean {
  const adminEmail = getAdminEmail();
  if (!adminEmail || !email) {
    return false;
  }

  return email.trim().toLowerCase() === adminEmail;
}
