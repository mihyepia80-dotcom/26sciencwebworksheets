import type { Answers } from "@/lib/types";

export const BUBBLE_COUNTS_KEY = "_bubbleCounts";

export interface BubbleCounts {
  shared: number;
  uniqueA: number;
  uniqueB: number;
}

export const DEFAULT_BUBBLE_COUNTS: BubbleCounts = { shared: 2, uniqueA: 3, uniqueB: 3 };

const MAX_BUBBLES = 12;

export function clampBubbleCounts(counts: Partial<BubbleCounts>): BubbleCounts {
  return {
    shared: Math.min(MAX_BUBBLES, Math.max(1, counts.shared ?? DEFAULT_BUBBLE_COUNTS.shared)),
    uniqueA: Math.min(MAX_BUBBLES, Math.max(1, counts.uniqueA ?? DEFAULT_BUBBLE_COUNTS.uniqueA)),
    uniqueB: Math.min(MAX_BUBBLES, Math.max(1, counts.uniqueB ?? DEFAULT_BUBBLE_COUNTS.uniqueB)),
  };
}

export function parseBubbleCounts(values: Answers): BubbleCounts {
  const raw = values[BUBBLE_COUNTS_KEY];
  if (!raw) {
    const migrated = migrateLegacyCounts(values);
    if (migrated) return migrated;
    return { ...DEFAULT_BUBBLE_COUNTS };
  }
  try {
    return clampBubbleCounts(JSON.parse(raw) as Partial<BubbleCounts>);
  } catch {
    return { ...DEFAULT_BUBBLE_COUNTS };
  }
}

function migrateLegacyCounts(values: Answers): BubbleCounts | null {
  const hasLegacy =
    values.topUnique1 !== undefined ||
    values.shared1 !== undefined ||
    values.bottomUnique1 !== undefined;
  if (!hasLegacy) return null;

  let uniqueA = 0;
  let uniqueB = 0;
  let shared = 0;
  for (let i = 1; i <= MAX_BUBBLES; i++) {
    if (values[`topUnique${i}`] !== undefined) uniqueA = i;
    if (values[`bottomUnique${i}`] !== undefined) uniqueB = i;
    if (values[`shared${i}`] !== undefined) shared = i;
  }
  return clampBubbleCounts({
    uniqueA: uniqueA || DEFAULT_BUBBLE_COUNTS.uniqueA,
    uniqueB: uniqueB || DEFAULT_BUBBLE_COUNTS.uniqueB,
    shared: shared || DEFAULT_BUBBLE_COUNTS.shared,
  });
}

export function migrateLegacyBubbleValues(values: Answers, onChange: (key: string, value: string) => void) {
  if (values[BUBBLE_COUNTS_KEY]) return;

  const counts = migrateLegacyCounts(values);
  if (!counts) return;

  for (let i = 0; i < counts.uniqueA; i++) {
    const legacy = values[`topUnique${i + 1}`];
    if (legacy) onChange(`uniqueA_${i}`, legacy);
  }
  for (let i = 0; i < counts.uniqueB; i++) {
    const legacy = values[`bottomUnique${i + 1}`];
    if (legacy) onChange(`uniqueB_${i}`, legacy);
  }
  for (let i = 0; i < counts.shared; i++) {
    const legacy = values[`shared${i + 1}`];
    if (legacy) onChange(`shared_${i}`, legacy);
  }
  onChange(BUBBLE_COUNTS_KEY, JSON.stringify(counts));
}

export function doubleBubbleFieldKeys(values: Answers): string[] {
  const counts = parseBubbleCounts(values);
  const keys = ["subjectA", "subjectB"];
  for (let i = 0; i < counts.shared; i++) keys.push(`shared_${i}`);
  for (let i = 0; i < counts.uniqueA; i++) keys.push(`uniqueA_${i}`);
  for (let i = 0; i < counts.uniqueB; i++) keys.push(`uniqueB_${i}`);
  return keys;
}

export function defaultDoubleBubbleFieldKeys(): string[] {
  return doubleBubbleFieldKeys({ [BUBBLE_COUNTS_KEY]: JSON.stringify(DEFAULT_BUBBLE_COUNTS) });
}

export type BubbleSection = "shared" | "uniqueA" | "uniqueB";

export function bubbleKey(section: BubbleSection, index: number): string {
  if (section === "shared") return `shared_${index}`;
  if (section === "uniqueA") return `uniqueA_${index}`;
  return `uniqueB_${index}`;
}
