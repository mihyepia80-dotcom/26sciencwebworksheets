/** 모든 학습지 공통 마무리 입력 필드 키 */
export const CLOSING_HEADLINE_KEY = "closingHeadline";

export const CLOSING_CHECKLIST = [
  {
    key: "closingCheckTerms",
    label: "핵심 과학 용어를 정확하게 사용했는가?",
  },
  {
    key: "closingCheckEvidence",
    label: "나의 생각·주장과 이를 뒷받침하는 구체적인 근거·데이터를 포함했는가?",
  },
  {
    key: "closingCheckCausal",
    label: '문장이 "~이다", "~때문이다"와 같이 논리적인 인과 관계로 끝나는가?',
  },
] as const;

/** 헤드라인 학습지는 본문에 한 줄 제목 필드가 있어 결론란을 생략 */
export const TEMPLATES_SKIP_CLOSING_HEADLINE = new Set(["headline"]);

export function getClosingValidationKeys(templateId: string): string[] {
  const keys = CLOSING_CHECKLIST.map((c) => c.key);
  if (!TEMPLATES_SKIP_CLOSING_HEADLINE.has(templateId)) {
    return [CLOSING_HEADLINE_KEY, ...keys];
  }
  return keys;
}

export function appendClosingFieldKeys(templateId: string, fieldKeys: string[]): string[] {
  const closing = getClosingValidationKeys(templateId);
  const merged = [...fieldKeys];
  for (const key of closing) {
    if (!merged.includes(key)) merged.push(key);
  }
  return merged;
}

export const CLOSING_HEADLINE_MIN_CHARS = 30;
