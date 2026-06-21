export const CSQ_INQUIRY_MEMO = [
  "황설탕 용액(색깔 있는 용액): 용액이 진할수록 색깔이 더 진하고 살짝 끈적임.",
  "백설탕 용액(색깔 없는 용액): 용액이 진할수록 방울토마토가 더 높이 떠오름.",
] as const;

export const CSQ_SECTIONS = [
  {
    key: "claim",
    badge: "주장",
    badgeClass: "bg-blue-600",
    title: "주장",
    guide: "질문: 색깔이 없는 투명한 용액의 진하기는 어떻게 비교하여 증명할 수 있을까요?",
    placeholder:
      "예시) 색깔이 없는 투명한 용액이더라도 물체를 띄워보면 진하기를 비교할 수 있다.",
    rows: 4,
    focusClass: "focus:border-blue-500",
  },
  {
    key: "support",
    badge: "근거",
    badgeClass: "bg-emerald-600",
    title: "근거",
    guide: "질문: 그렇게 주장하는 과학적 실험 근거(관찰한 데이터, 방울토마토 현상)는 무엇인가요?",
    placeholder:
      "예시) 왜냐하면 백설탕을 많이 녹여 더 진하게 만든 용액에 방울토마토를 넣었을 때가, 설탕을 적게 녹인 연한 용액에서보다 방울토마토가 훨씬 더 높이 떠 올랐기 때문이다.",
    rows: 5,
    focusClass: "focus:border-emerald-500",
  },
  {
    key: "question",
    badge: "질문",
    badgeClass: "bg-amber-600",
    title: "질문",
    guide: "질문: 오늘 실험 결과와 관련하여 더 탐구하고 싶거나 새롭게 생겨난 질문은 무엇인가요?",
    placeholder:
      "예시) 그렇다면 방울토마토가 아니라 메추리알을 넣어도 용액이 진할수록 더 높이 떠오를까?",
    rows: 4,
    focusClass: "focus:border-amber-500",
  },
] as const;
