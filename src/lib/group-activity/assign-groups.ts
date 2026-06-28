import type { AchievementLevel, Gender, GroupSlot, RosterStudent, SeparationRule } from "./types";
import { GROUP_COUNT } from "./constants";
import { expandSeparationToPairRules } from "./separation-rules";

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function violatesSeparation(groupIds: string[], rules: SeparationRule[]): boolean {
  for (const rule of rules) {
    const ids = rule.studentIds.filter((id) => groupIds.includes(id));
    // 쌍(OR) 규칙: 정확히 2명이 같은 모둠이면 위반
    if (rule.studentIds.length === 2 && ids.length === 2) return true;
    if (rule.studentIds.length !== 2 && ids.length >= 2) return true;
  }
  return false;
}

function genderCounts(students: RosterStudent[]) {
  return students.reduce(
    (acc, s) => {
      if (s.gender === "male") acc.male += 1;
      else acc.female += 1;
      return acc;
    },
    { male: 0, female: 0 },
  );
}

function achievementSet(students: RosterStudent[]): Set<AchievementLevel> {
  return new Set(students.map((s) => s.achievementLevel));
}

function canAddToGroup(group: RosterStudent[], student: RosterStudent, rules: SeparationRule[]): boolean {
  const ids = [...group.map((s) => s.id), student.id];
  if (violatesSeparation(ids, rules)) return false;

  const next = [...group, student];
  const size = next.length;
  const g = genderCounts(next);

  if (size > 4) return false;
  if (g.male > 2 || g.female > 2) return false;
  if (size >= 3 && g.male < 1 && g.female < 1) return false;

  return true;
}

function groupScore(group: RosterStudent[]): number {
  const levels = achievementSet(group);
  const g = genderCounts(group);
  let score = levels.size * 10;
  if (g.male >= 1 && g.female >= 1) score += 5;
  const sizePenalty = Math.abs(group.length - 4);
  return score - sizePenalty * 3;
}

function assignWithSeed(students: RosterStudent[], rules: SeparationRule[], seed: number): GroupSlot[] | null {
  const rand = mulberry32(seed);
  const pool = shuffle(students, rand);
  const groups: RosterStudent[][] = Array.from({ length: GROUP_COUNT }, () => []);

  for (const student of pool) {
    let bestIdx = -1;
    let bestScore = -Infinity;

    for (let i = 0; i < GROUP_COUNT; i++) {
      if (groups[i].length >= 4) continue;
      if (!canAddToGroup(groups[i], student, rules)) continue;
      const score = groupScore([...groups[i], student]);
      if (score > bestScore || (score === bestScore && groups[i].length < groups[bestIdx]?.length)) {
        bestScore = score;
        bestIdx = i;
      }
    }

    if (bestIdx === -1) return null;
    groups[bestIdx].push(student);
  }

  for (const group of groups) {
    if (group.length < 3 || group.length > 4) return null;
    const g = genderCounts(group);
    if (group.length === 4 && (g.male < 1 || g.female < 1 || g.male > 2 || g.female > 2)) return null;
    if (group.length === 3 && g.male + g.female !== 3) return null;
  }

  return groups.map((g, i) => ({
    groupNo: i + 1,
    memberIds: g.map((s) => s.id),
  }));
}

function tryAssignWithRules(
  active: RosterStudent[],
  rules: SeparationRule[],
  seed: number,
): GroupSlot[] | null {
  for (let attempt = 0; attempt < 200; attempt++) {
    const result = assignWithSeed(active, rules, seed + attempt);
    if (result) return result;
  }
  return null;
}

export function assignGroups(students: RosterStudent[], rules: SeparationRule[], seed = Date.now()): GroupSlot[] {
  const active = students.filter((s) => s.active);
  if (active.length < GROUP_COUNT * 3) {
    throw new Error(`학생 수가 부족합니다. 최소 ${GROUP_COUNT * 3}명이 필요합니다. (현재 ${active.length}명)`);
  }

  const pairs = expandSeparationToPairRules(rules);

  let result = tryAssignWithRules(active, pairs, seed);
  if (result) return result;

  // OR 완화: 쌍 규칙을 하나씩 제외하며 6모둠 구성 시도
  for (let relax = 1; relax <= pairs.length; relax++) {
    const relaxed = pairs.slice(0, pairs.length - relax);
    result = tryAssignWithRules(active, relaxed, seed + relax * 997);
    if (result) return result;
  }

  result = tryAssignWithRules(active, [], seed + 9999);
  if (result) return result;

  throw new Error("조건을 만족하는 모둠 편성을 찾지 못했습니다. 분리 조건을 줄이거나 학생 수·성별 구성을 확인해 주세요.");
}
