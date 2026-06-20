export const CSI_UNIT = "과학 5학년 2학기 / 3. 용해와 용액 (9~10차시)";
export const CSI_TOPIC = "일상생활에서 용액이 필요한 이유를 알리는 디지털 자료 만들기 및 생각 성찰";

export const CSI_REMINDERS = [
  "물질이 용해되어 진짜 '용액'이 되면 뜨거나 가라앉는 것이 없고, 모든 부분의 성질(색깔, 맛 등)이 일정하다.",
  "일상 속 보건·위생 용액(손 소독제, 구강 청결제)이나 요리 용액(식초) 등은 성분이 골고루 섞여 있어야 안전하고 효과가 일정하므로 완벽한 용액 상태를 유지해야 한다.",
] as const;

export const CSI_WRITING_GUIDE =
  "이번 단원에서 배운 용해와 용액의 과학적 원리, 그리고 우리 생활 속 용액이 지닌 필요성과 가치를 나만의 독창적인 색상, 기호, 이미지로 표현하고 그 이유를 과학 용어를 사용하여 서술해 봅시다.";

export const CSI_SECTIONS = [
  {
    badge: "Color",
    badgeClass: "bg-rose-600",
    title: "나를 표현하는 색상",
    panelClass: "border-slate-200 bg-rose-50/30",
    focusClass: "focus:border-rose-500",
    textKey: "colorText",
    reasonKey: "colorReason",
    question:
      "용액의 가치나 성질을 가장 잘 나타내는 색상은 무엇인가요? 색을 정하고 그렇게 비유한 과학적 이유를 써보세요.",
    textPlaceholder: "예: 초록색, 투명색",
    reasonPlaceholder: "이 색이 용액의 어떤 특징을 닮았는지 과학적으로 서술하세요.",
    showColorPicker: true,
    imageOnly: false,
  },
  {
    badge: "Symbol",
    badgeClass: "bg-blue-600",
    title: "본질을 담은 기호",
    panelClass: "border-slate-200 bg-blue-50/30",
    focusClass: "focus:border-blue-500",
    textKey: "symbolText",
    reasonKey: "symbolReason",
    question:
      "용액의 특징을 표현할 수 있는 기호(=, +, !, ∝ 등)는 무엇인가요? 기호를 선택하고 과학적 의미를 설명해 보세요.",
    textPlaceholder: "예: =, +",
    reasonPlaceholder: "선택한 기호가 용액의 어떤 과학적 원리를 나타내는지 서술하세요.",
    showColorPicker: false,
    imageOnly: false,
  },
  {
    badge: "Image",
    badgeClass: "bg-amber-600",
    title: "머릿속의 이미지 묘사",
    panelClass: "border-slate-200 bg-amber-50/30",
    focusClass: "focus:border-amber-500",
    textKey: "",
    reasonKey: "imageReason",
    question:
      "용해 현상이나 일상 속 용액을 떠올렸을 때 생각나는 구체적인 장면이나 이미지를 묘사하고, 과학적 가치를 연관 지어 써보세요.",
    textPlaceholder: "",
    reasonPlaceholder:
      "예: 눈에 보이지 않는 작은 그물망들이 설탕 입자들을 꽉 붙잡고 공중에 고르게 띄워놓은 장면이 떠오른다. 용매와 용질이 완벽하게 섞여 성질이 일정하다는 용액의 특징을 나타내기 때문이다.",
    showColorPicker: false,
    imageOnly: true,
  },
] as const;
