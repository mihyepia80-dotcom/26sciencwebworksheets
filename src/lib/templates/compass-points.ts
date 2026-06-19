export const COMPASS_POINT_SECTIONS = [
  {
    key: "needToKnow",
    direction: "N",
    labelEn: "NEED TO KNOW",
    labelKo: "알아야 할 점",
    prompt: "무엇을 더 알아야 할까?",
    clipPath: "polygon(0% 0%, 100% 0%, 50% 50%)",
    labelClass: "left-1/2 top-2 -translate-x-1/2",
    inputClass: "pt-8 pb-[52%] pl-[12%] pr-[12%]",
  },
  {
    key: "excited",
    direction: "E",
    labelEn: "EXCITED",
    labelKo: "흥미로운 점",
    prompt: "무엇이 흥미로울까?",
    clipPath: "polygon(100% 0%, 100% 100%, 50% 50%)",
    labelClass: "right-2 top-1/2 -translate-y-1/2 [writing-mode:vertical-rl]",
    inputClass: "pt-[12%] pb-[12%] pl-[52%] pr-3",
  },
  {
    key: "steps",
    direction: "S",
    labelEn: "STEPS TO MOVE FORWARD",
    labelKo: "다음 단계",
    prompt: "다음에 무엇을 할까?",
    clipPath: "polygon(0% 100%, 100% 100%, 50% 50%)",
    labelClass: "bottom-2 left-1/2 -translate-x-1/2 text-center",
    inputClass: "pt-[52%] pb-8 pl-[12%] pr-[12%]",
  },
  {
    key: "worries",
    direction: "W",
    labelEn: "WORRIES",
    labelKo: "걱정되는 점",
    prompt: "무엇이 걱정될까?",
    clipPath: "polygon(0% 0%, 0% 100%, 50% 50%)",
    labelClass: "left-2 top-1/2 -translate-y-1/2 [writing-mode:vertical-rl]",
    inputClass: "pt-[12%] pb-[12%] pl-3 pr-[52%]",
  },
] as const;

export type CompassPointKey = (typeof COMPASS_POINT_SECTIONS)[number]["key"];

export function compassPointFieldKeys(): string[] {
  return COMPASS_POINT_SECTIONS.map((s) => s.key);
}
