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

function formatShortDot(iso: string): string {
  const date = parseDateOnly(iso);
  return `${date.getMonth() + 1}.${date.getDate()}`;
}

/** 해당 월의 n번째 월요일(1=첫째 주) */
function mondayWeekOfMonth(monday: Date): number {
  let count = 0;
  const year = monday.getFullYear();
  const month = monday.getMonth();
  for (let d = 1; d <= monday.getDate(); d++) {
    if (new Date(year, month, d).getDay() === 1) count += 1;
  }
  return Math.max(1, count);
}

export function getWeekInfo(date = new Date(), anchorIso = ROLE_WEEK_ANCHOR) {
  const anchor = parseDateOnly(anchorIso);
  anchor.setHours(0, 0, 0, 0);
  const today = new Date(date);
  today.setHours(0, 0, 0, 0);

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const diffWeeks = Math.floor((today.getTime() - anchor.getTime()) / msPerWeek);
  const weekIndex = Math.max(1, diffWeeks + 1);

  const weekStart = new Date(anchor.getTime() + (weekIndex - 1) * msPerWeek);
  const weekEnd = new Date(weekStart.getTime() + 4 * 24 * 60 * 60 * 1000);

  const monthWeek = mondayWeekOfMonth(weekStart);
  const monthLabel = weekStart.getMonth() + 1;

  return {
    weekIndex,
    weekStart: formatDateOnly(weekStart),
    weekEnd: formatDateOnly(weekEnd),
    weekStartLabel: formatKoreanDate(formatDateOnly(weekStart)),
    weekEndLabel: formatKoreanDate(formatDateOnly(weekEnd)),
    monthWeekLabel: `${monthLabel}월 ${monthWeek}주`,
    schoolWeekLabel: `${monthLabel}월 ${monthWeek}주(${formatShortDot(formatDateOnly(weekStart))}~${formatShortDot(formatDateOnly(weekEnd))})`,
  };
}

/** 수업 주간: 월~금 (예: 6월 5주(6.29~7.3)) */
export function formatWeekRange(weekStart: string, weekEnd: string): string {
  const start = parseDateOnly(weekStart);
  const month = start.getMonth() + 1;
  const week = mondayWeekOfMonth(start);
  return `${month}월 ${week}주(${formatShortDot(weekStart)}~${formatShortDot(weekEnd)})`;
}

export function formatWeekRangeLong(weekStart: string, weekEnd: string): string {
  return `${formatKoreanDate(weekStart)}(월) ~ ${formatKoreanDate(weekEnd)}(금)`;
}
