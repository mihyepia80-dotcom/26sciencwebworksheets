function parseAdminList(raw?: string): string[] {
  return (raw ?? "")
    .split(/[,;\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Vercel 공용 API 키(GEMINI·Padlet)를 쓸 수 있는 플랫폼 관리자 */
export function isPlatformAdmin(uid: string, email?: string | null): boolean {
  const adminUids = parseAdminList(process.env.ADMIN_UIDS);
  if (adminUids.includes(uid)) return true;

  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) return false;

  const adminEmails = parseAdminList(process.env.ADMIN_EMAILS).map((e) => e.toLowerCase());
  return adminEmails.includes(normalizedEmail);
}

export function getPlatformGeminiApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  return key || null;
}

export function getPlatformPadletApiKey(): string | null {
  const key = process.env.PADLET_API_KEY?.trim();
  return key || null;
}
