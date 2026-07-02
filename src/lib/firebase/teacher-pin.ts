const STORAGE_KEY = "sagodogu_teacher_pin";

export function isTeacherPinVerified(uid: string): boolean {
  if (typeof sessionStorage === "undefined") return false;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw) as { uid: string };
    return data.uid === uid;
  } catch {
    return false;
  }
}

export function setTeacherPinVerified(uid: string): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ uid }));
}

export function clearTeacherPinVerified(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
