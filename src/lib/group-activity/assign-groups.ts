import type { AchievementLevel, GroupSlot, RosterStudent, SeparationRule } from "./types";
import { GROUP_COUNT } from "./constants";
import { expandSeparationToPairRules } from "./separation-rules";

export interface AssignGroupsResult {
  groups: GroupSlot[];
  /** 완화 단계 사용 시 UI 안내용 */
  notice?: string;
}

type AssignMode = "strict" | "relaxedGender" | "sizeOnly" | "unrestricted";

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

/** 18~24명 → 6모둠, 모둠당 3~4명 합이 맞도록 4인·3인 모둠 개수 계산 */
export function planGroupSizes(studentCount: number): number[] | null {
  if (studentCount < GROUP_COUNT * 3 || studentCount > GROUP_COUNT * 4) return null;
  const fourPersonGroups = studentCount - GROUP_COUNT * 3;
  const sizes = [
    ...Array(fourPersonGroups).fill(4),
    ...Array(GROUP_COUNT - fourPersonGroups).fill(3),
  ] as number[];
  return sizes;
}

function violatesSeparation(groupIds: string[], rules: SeparationRule[]): boolean {
  for (const rule of rules) {
    const ids = rule.studentIds.filter((id) => groupIds.includes(id));
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

function canAddToGroup(
  group: RosterStudent[],
  student: RosterStudent,
  rules: SeparationRule[],
  targetSize: number,
  mode: AssignMode,
): boolean {
  if (group.length >= targetSize) return false;

  const ids = [...group.map((s) => s.id), student.id];
  if (rules.length > 0 && violatesSeparation(ids, rules)) return false;

  const next = [...group, student];
  const g = genderCounts(next);

  if (mode !== "unrestricted" && (g.male > 2 || g.female > 2)) return false;

  if (mode === "sizeOnly" || mode === "unrestricted") return true;

  if (mode === "relaxedGender") return true;

  // strict: 4인 모둠 완성 시 남·녀 1~2명
  if (next.length === targetSize && targetSize === 4) {
    if (g.male < 1 || g.female < 1 || g.male > 2 || g.female > 2) return false;
  }

  return true;
}

function validateGroup(group: RosterStudent[], targetSize: number, mode: AssignMode): boolean {
  if (group.length !== targetSize) return false;
  if (mode === "unrestricted") return true;
  const g = genderCounts(group);
  if (g.male > 2 || g.female > 2) return false;
  if (mode === "strict" && targetSize === 4 && (g.male < 1 || g.female < 1)) return false;
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

function separationDegree(studentId: string, rules: SeparationRule[]): number {
  return rules.filter((r) => r.studentIds.includes(studentId)).length;
}

function assignWithPlan(
  students: RosterStudent[],
  rules: SeparationRule[],
  sizes: number[],
  seed: number,
  mode: AssignMode,
): GroupSlot[] | null {
  const rand = mulberry32(seed);
  const targets = [...sizes].sort((a, b) => b - a);
  const groups: RosterStudent[][] = targets.map(() => []);

  const pool = shuffle(students, rand).sort(
    (a, b) => separationDegree(b.id, rules) - separationDegree(a.id, rules),
  );

  for (const student of pool) {
    let bestIdx = -1;
    let bestScore = -Infinity;

    for (let i = 0; i < GROUP_COUNT; i++) {
      if (groups[i].length >= targets[i]) continue;
      if (!canAddToGroup(groups[i], student, rules, targets[i], mode)) continue;

      const remaining = targets[i] - groups[i].length - 1;
      const score = groupScore([...groups[i], student]) + remaining * 3;
      if (score > bestScore || (score === bestScore && groups[i].length < groups[bestIdx]?.length)) {
        bestScore = score;
        bestIdx = i;
      }
    }

    if (bestIdx === -1) return null;
    groups[bestIdx].push(student);
  }

  for (let i = 0; i < GROUP_COUNT; i++) {
    if (!validateGroup(groups[i], targets[i], mode)) return null;
  }

  return groups.map((g, i) => ({
    groupNo: i + 1,
    memberIds: g.map((s) => s.id),
  }));
}

function tryAssignWithRules(
  active: RosterStudent[],
  rules: SeparationRule[],
  sizes: number[],
  seed: number,
  mode: AssignMode,
): GroupSlot[] | null {
  for (let attempt = 0; attempt < 400; attempt++) {
    const result = assignWithPlan(active, rules, sizes, seed + attempt * 17, mode);
    if (result) return result;
  }
  return null;
}

function buildFailureMessage(active: RosterStudent[]): string {
  const g = genderCounts(active);
  const sizes = planGroupSizes(active.length);
  const parts = [
    "6모둠 자동 편성에 실패했습니다.",
    `현재 ${active.length}명(남 ${g.male}·여 ${g.female}).`,
  ];
  if (!sizes) {
    parts.push(`6모둠 편성에는 ${GROUP_COUNT * 3}~${GROUP_COUNT * 4}명(18~24명)이 필요합니다.`);
  } else if (g.male > GROUP_COUNT * 2 || g.female > GROUP_COUNT * 2) {
    parts.push(
      `모둠당 같은 성별 최대 2명 기준으로는 남·녀 각 ${GROUP_COUNT * 2}명까지 배치할 수 있습니다. 성별 비율(남 ${g.male}·여 ${g.female})을 확인해 주세요.`,
    );
  } else if (g.male < GROUP_COUNT || g.female < GROUP_COUNT) {
    parts.push("4인 모둠마다 남·녀 1명 이상이 필요해 성별 구성이 맞지 않을 수 있습니다. 명단 성별을 확인하거나 분리 조건을 줄여 주세요.");
  } else {
    parts.push("분리 조건이 많거나 조합이 어렵습니다. 분리 쌍을 줄인 뒤 다시 시도해 주세요.");
  }
  return parts.join(" ");
}

export function assignGroups(
  students: RosterStudent[],
  rules: SeparationRule[],
  seed = Date.now(),
): GroupSlot[] {
  return assignGroupsWithMeta(students, rules, seed).groups;
}

export function assignGroupsWithMeta(
  students: RosterStudent[],
  rules: SeparationRule[],
  seed = Date.now(),
): AssignGroupsResult {
  const active = students.filter((s) => s.active);
  const sizes = planGroupSizes(active.length);
  if (!sizes) {
    throw new Error(
      `학생 수가 부족하거나 많습니다. 6모둠 편성에는 ${GROUP_COUNT * 3}~${GROUP_COUNT * 4}명이 필요합니다. (현재 ${active.length}명)`,
    );
  }

  const pairs = expandSeparationToPairRules(rules);

  const attempts: { rules: SeparationRule[]; mode: AssignMode; notice?: string }[] = [
    { rules: pairs, mode: "strict" },
  ];

  for (let relax = 1; relax < pairs.length; relax++) {
    attempts.push({
      rules: pairs.slice(0, pairs.length - relax),
      mode: "strict",
      notice: `일부 분리 쌍을 완화해 편성했습니다. (${pairs.length - relax}/${pairs.length}쌍 적용)`,
    });
  }

  attempts.push(
    { rules: pairs, mode: "relaxedGender", notice: "성별 혼합 조건을 완화해 편성했습니다." },
    { rules: [], mode: "strict", notice: "분리 조건 없이 편성했습니다." },
    { rules: [], mode: "relaxedGender", notice: "분리·성별 조건을 완화해 편성했습니다." },
    { rules: [], mode: "sizeOnly", notice: "인원·모둠 수만 맞춰 편성했습니다. 성별·분리 조건을 확인해 주세요." },
    {
      rules: [],
      mode: "unrestricted",
      notice: "성별·분리 조건을 적용하지 않고 인원만 맞춰 편성했습니다. 결과를 꼭 확인해 주세요.",
    },
  );

  for (let i = 0; i < attempts.length; i++) {
    const { rules: ruleSet, mode, notice } = attempts[i];
    const result = tryAssignWithRules(active, ruleSet, sizes, seed + i * 7919, mode);
    if (result) {
      return { groups: result, notice: i === 0 ? undefined : notice };
    }
  }

  throw new Error(buildFailureMessage(active));
}
