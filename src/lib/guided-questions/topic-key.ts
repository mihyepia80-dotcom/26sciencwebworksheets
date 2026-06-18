/** 활동 주제 비교·조회용 정규화 키 */
export function normalizeTopicKey(topic: string): string {
  return topic
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

export function isTopicReadyForGuidedQuestions(topic: string): boolean {
  return normalizeTopicKey(topic).length >= 2;
}
