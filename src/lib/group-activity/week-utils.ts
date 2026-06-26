import { ROLE_WEEK_ANCHOR } from "./constants";

function parseDateOnly(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatKoreanDate(iso: string): string {
  const date = parseDateOnly(iso);
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
}

export function getWeekInfo(date = new Date(), anchorIso = ROLE_WEEK_ANCHOR) {
  const anchor = parseDateOnly(anchorIso);
  anchor.setHours(0, 0, 0, 0);
  const today = new Date(date);
  today.setHours(0, 0, 0, 0);

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const diffWeeks = Math.floor((today.getTime() - anchor.getTime()) / msPerWeek);
  const weekIndex = diffWeeks + 1;

  const weekStart = new Date(anchor.getTime() + (weekIndex - 1) * msPerWeek);
  const weekEnd = new Date(weekStart.getTime() + 6 * msPerWeek);

  return {
    weekIndex: Math.max(1, weekIndex),
    weekStart: formatDateOnly(weekStart),
    weekEnd: formatDateOnly(weekEnd),
    weekStartLabel: formatKoreanDate(formatDateOnly(weekStart)),
    weekEndLabel: formatKoreanDate(formatDateOnly(weekEnd)),
  };
}

export function formatWeekRange(weekStart: string, weekEnd: string): string {
  return `${formatKoreanDate(weekStart)}(월) ~ ${formatKoreanDate(weekEnd)}(일)`;
}
