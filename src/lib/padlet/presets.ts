export const PADLET_DEFAULT_ROLE = "초등 과학 교사";

export type PadletSandboxType = "wall" | "stream" | "grid" | "map" | "canvas" | "shelf";

export type PadletBulletinColumnMode = "groups" | "numbers";

export interface PadletSandboxOption {
  id: PadletSandboxType;
  label: string;
  desc: string;
  layoutName: string;
}

export const PADLET_SANDBOX_OPTIONS: PadletSandboxOption[] = [
  {
    id: "wall",
    label: "벽형 (Wall)",
    desc: "자유롭게 카드를 붙이는 클래식 협업 벽",
    layoutName: "wall",
  },
  {
    id: "stream",
    label: "스트림 (Stream)",
    desc: "시간순 타임라인 · 활동 흐름 정리",
    layoutName: "stream",
  },
  {
    id: "grid",
    label: "격자 (Grid)",
    desc: "정돈된 격자 · 사진·짧은 글 모음",
    layoutName: "grid",
  },
  {
    id: "map",
    label: "지도 (Map)",
    desc: "장소·지역과 연결된 학습 활동",
    layoutName: "map",
  },
  {
    id: "canvas",
    label: "캔버스 (Canvas)",
    desc: "자유 배치 · 마인드맵·포스터형",
    layoutName: "canvas",
  },
  {
    id: "shelf",
    label: "컬럼 (Shelf)",
    desc: "선반형 컬럼 · 모둠별 칸 나누기 연습",
    layoutName: "shelf/column",
  },
];

const PASTEL_THEME =
  "Use a soft pastel color theme (light pink, mint green, lavender, peach, baby blue, pale lemon). " +
  "Background and cards should feel gentle and elementary-classroom friendly.";

export function buildColumnLabels(mode: PadletBulletinColumnMode): string[] {
  if (mode === "groups") {
    return Array.from({ length: 6 }, (_, i) => `${i + 1}모둠`);
  }
  return Array.from({ length: 25 }, (_, i) => `${i + 1}번`);
}

export function buildSandboxInstructions(sandboxType: PadletSandboxType): string {
  const option = PADLET_SANDBOX_OPTIONS.find((item) => item.id === sandboxType) ?? PADLET_SANDBOX_OPTIONS[0];

  return (
    `Create a collaborative sandbox Padlet for Korean elementary classroom testing. ` +
    `Layout type: ${option.layoutName} (${option.label}). ` +
    `${PASTEL_THEME} ` +
    "Include a short Korean welcome area, one sample student note card, and space for teachers to try posting. " +
    "Title and descriptions should be easy to understand for Korean elementary teachers."
  );
}

export function buildBulletinInstructions(input: { topic: string; columnMode: PadletBulletinColumnMode }): string {
  const trimmed = input.topic.trim() || "자유 주제";
  const labels = buildColumnLabels(input.columnMode);
  const labelPreview = labels.slice(0, 4).join(", ") + (labels.length > 4 ? ", …" : "");
  const columnKind = input.columnMode === "groups" ? "1모둠 through 6모둠" : "1번 through 25번";

  return (
    `Create a Korean elementary classroom bulletin Padlet about "${trimmed}". ` +
    `MUST use COLUMN / Shelf layout (not wall or grid). ` +
    `Create exactly ${labels.length} columns as separate sections, arranged left to right. ` +
    `Column headers in order: ${labels.map((l) => `"${l}"`).join(", ")}. ` +
    `${PASTEL_THEME} ` +
    `Each column is for ${columnKind} student posts (example headers: ${labelPreview}). ` +
    "Include a brief Korean teacher introduction in the board description. " +
    "Leave columns ready for students to add cards."
  );
}

export function resolveBoardInstructions(input: {
  mode: "sandbox" | "bulletin" | "custom";
  sandboxType?: PadletSandboxType;
  instructions?: string;
  topic?: string;
  columnMode?: PadletBulletinColumnMode;
}): string {
  if (input.mode === "sandbox") {
    const type = input.sandboxType ?? "wall";
    return buildSandboxInstructions(type);
  }
  if (input.mode === "bulletin") {
    return buildBulletinInstructions({
      topic: input.topic ?? "",
      columnMode: input.columnMode ?? "groups",
    });
  }
  const custom = String(input.instructions ?? "").trim();
  if (!custom) {
    throw new Error("맞춤 생성 instructions를 입력해 주세요.");
  }
  if (custom.length > 2000) {
    throw new Error("생성 지시문은 2000자 이내로 입력해 주세요.");
  }
  return custom;
}

export const PADLET_PASTEL_POST_COLORS = ["blue", "green", "purple", "orange", "red"] as const;
