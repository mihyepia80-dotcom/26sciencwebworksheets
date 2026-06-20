/** 배지 아이콘 키 — 상의(티셔츠) 스타일 SVG */
export type BadgeIconKey = "shirt-green" | "shirt-blue" | "shirt-purple" | "shirt-amber" | "shirt-rose";

export interface BadgeDefinition {
  id?: string;
  label: string;
  iconKey: BadgeIconKey;
  active: boolean;
  order: number;
  teacherUid?: string;
  isDefault?: boolean;
}

export interface StudentBadgeAward {
  id?: string;
  studentUid: string;
  studentName: string;
  grade: string;
  classNo: string;
  studentNo: string;
  badgeId: string;
  badgeLabel: string;
  iconKey: BadgeIconKey;
  awardedBy: string;
  awardedAt: Date | null;
  note?: string;
}

export const DEFAULT_BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "default-diligent",
    label: "매우 성실하게 했어요",
    iconKey: "shirt-green",
    active: true,
    order: 1,
    isDefault: true,
  },
  {
    id: "default-complete",
    label: "빠짐없이 했어요",
    iconKey: "shirt-blue",
    active: true,
    order: 2,
    isDefault: true,
  },
  {
    id: "default-creative",
    label: "창의적으로 했어요",
    iconKey: "shirt-purple",
    active: true,
    order: 3,
    isDefault: true,
  },
];
