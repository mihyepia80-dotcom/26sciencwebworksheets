export const PADLET_DEFAULT_ROLE = "초등 과학 교사";

export const PADLET_SANDBOX_INSTRUCTIONS =
  "Create a simple collaborative sandbox padlet for elementary classroom testing. " +
  "Use a wall layout with a welcome area, space for students to post short text notes, and one sample link card. " +
  "Title and descriptions should be easy to understand for Korean elementary teachers.";

export function buildBulletinInstructions(topic: string): string {
  const trimmed = topic.trim() || "자유 주제";
  return (
    `Create a classroom bulletin board padlet for elementary students about "${trimmed}". ` +
    "Use a wall or grid layout with clear sections for student ideas, questions, and reflections. " +
    "Include a short teacher introduction post area. Korean-friendly titles and instructions."
  );
}

export function resolveBoardInstructions(input: {
  mode: "sandbox" | "bulletin" | "custom";
  instructions?: string;
  topic?: string;
}): string {
  if (input.mode === "sandbox") return PADLET_SANDBOX_INSTRUCTIONS;
  if (input.mode === "bulletin") return buildBulletinInstructions(input.topic ?? "");
  const custom = String(input.instructions ?? "").trim();
  if (!custom) {
    throw new Error("맞춤 생성 instructions를 입력해 주세요.");
  }
  if (custom.length > 2000) {
    throw new Error("생성 지시문은 2000자 이내로 입력해 주세요.");
  }
  return custom;
}
