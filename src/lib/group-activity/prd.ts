import prd from "../../../docs/PRD-group-roles.json";
import type { AchievementLevel } from "./types";

export type GroupActivityPrd = typeof prd;

export const GROUP_ACTIVITY_PRD = prd as GroupActivityPrd;

export const ROSTER_EXCEL_HEADERS = GROUP_ACTIVITY_PRD.rosterImport.columns.map((c) => c.header);

export const ROSTER_IMPORT_FORMATS = GROUP_ACTIVITY_PRD.rosterImport.formats;

export const ROSTER_TABLE_MAX_HEIGHT = GROUP_ACTIVITY_PRD.rosterTable.maxBodyHeight;

export function achievementLabelFromCode(code: AchievementLevel): string {
  const found = GROUP_ACTIVITY_PRD.achievementLevels.find((l) => l.code === code);
  return found?.label ?? "중";
}

export function achievementCodeFromLabel(raw: string): AchievementLevel {
  const v = raw.trim();
  if (v === "1" || v === "상") return 1;
  if (v === "3" || v === "하") return 3;
  return 2;
}
