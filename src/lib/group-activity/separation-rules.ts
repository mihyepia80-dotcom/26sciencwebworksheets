import type { RosterStudent, SeparationRule } from "./types";
import { normalizeStudentNo } from "./constants";

/** 분리 조건을 2명 쌍(OR 단위) 제약 목록으로 확장 — 3명 이상 한 묶음(AND)은 사용하지 않음 */
export function expandSeparationToPairRules(rules: SeparationRule[]): SeparationRule[] {
  const pairs: SeparationRule[] = [];
  const seen = new Set<string>();

  for (const rule of rules) {
    const ids = [...new Set(rule.studentIds)];
    if (ids.length < 2) continue;

    if (ids.length === 2) {
      const key = pairKey(ids[0], ids[1]);
      if (!seen.has(key)) {
        seen.add(key);
        pairs.push({
          ...rule,
          studentIds: ids,
          studentNos: pairNos(rule, ids),
        });
      }
      continue;
    }

    // 레거시: 3명 이상 한 규칙 → 등록된 쌍(OR)으로만 해석 (전체 조합 AND 아님)
    const nos = rule.studentNos ?? [];
    for (let i = 0; i < ids.length - 1; i++) {
      const a = ids[i];
      const b = ids[i + 1];
      const key = pairKey(a, b);
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push({
        ...rule,
        id: `${rule.id}__${key}`,
        studentIds: [a, b],
        studentNos: [nos[i], nos[i + 1]].filter(Boolean).map(normalizeStudentNo),
      });
    }
  }

  return pairs;
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}__${b}` : `${b}__${a}`;
}

function pairNos(rule: SeparationRule, ids: string[]): string[] {
  if (!rule.studentNos?.length) return [];
  const byId = new Map(rule.studentIds.map((id, i) => [id, rule.studentNos![i]]));
  return ids.map((id) => byId.get(id)).filter((no): no is string => Boolean(no)).map(normalizeStudentNo);
}

export function resolveSeparationStudentIds(
  rule: Pick<SeparationRule, "studentIds" | "studentNos">,
  students: RosterStudent[],
): string[] {
  const byId = new Set(students.map((s) => s.id));
  const byNo = new Map(students.map((s) => [normalizeStudentNo(s.studentNo), s.id]));

  const fromNos = (rule.studentNos ?? [])
    .map((no) => byNo.get(normalizeStudentNo(no)))
    .filter((id): id is string => Boolean(id));
  const fromIds = rule.studentIds.filter((id) => byId.has(id));

  return [...new Set([...fromNos, ...fromIds])];
}

export function normalizeSeparationRulesForAssign(
  separations: SeparationRule[],
  students: RosterStudent[],
): SeparationRule[] {
  const resolved = separations
    .map((rule) => ({
      ...rule,
      studentIds: resolveSeparationStudentIds(rule, students),
    }))
    .filter((rule) => rule.studentIds.length >= 2);

  return expandSeparationToPairRules(resolved);
}
