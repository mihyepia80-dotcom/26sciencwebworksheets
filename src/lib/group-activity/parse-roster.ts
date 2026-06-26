import { achievementCodeFromLabel } from "./prd";
import type { AchievementLevel, Gender } from "./types";

export function parseGender(raw: string): Gender | null {
  const v = raw.trim().toLowerCase();
  if (["남", "남자", "m", "male", "boy"].includes(v)) return "male";
  if (["여", "여자", "f", "female", "girl"].includes(v)) return "female";
  return null;
}

export function parseAchievementLevel(raw: string): AchievementLevel {
  return achievementCodeFromLabel(raw);
}
