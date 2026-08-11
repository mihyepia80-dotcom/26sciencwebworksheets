/** 위험 실험·개인정보 — AI 호출 전 차단 */
const UNSAFE_TERMS = [
  "불",
  "화재",
  "가스",
  "약품",
  "독",
  "칼",
  "칼로",
  "전기",
  "감전",
  "폭발",
  "화학약품",
  "전화번호",
  "010-",
  "010 ",
  "주소",
  "이름은",
  "내 이름",
];

const PII_PATTERN = /(\d{2,3}-\d{3,4}-\d{4})|(\d{10,11})/;

export function containsUnsafeInput(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (PII_PATTERN.test(t)) return true;
  const lower = t.toLowerCase();
  return UNSAFE_TERMS.some((term) => lower.includes(term.toLowerCase()));
}

export function getBlockedMessage(): string {
  return "안전하지 않거나 개인정보가 포함된 내용은 입력할 수 없어요. 교실에서 할 수 있는 탐구로 다시 적어 보세요.";
}
