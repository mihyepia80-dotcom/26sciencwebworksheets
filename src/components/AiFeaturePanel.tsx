import type { TemplateDefinition } from "@/lib/types";

interface AiFeaturePanelProps {
  template: Pick<TemplateDefinition, "aiFeatureLabel" | "aiFeature">;
  compact?: boolean;
}

export function AiFeaturePanel({ template, compact }: AiFeaturePanelProps) {
  if (!template.aiFeature) return null;

  return (
    <div
      className={`rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <p className="text-xs font-bold text-violet-800">
        AI 프로그램 구현 방식
        {template.aiFeatureLabel && (
          <span className="ml-2 rounded-full bg-violet-200/80 px-2 py-0.5 font-medium text-violet-900">
            {template.aiFeatureLabel}
          </span>
        )}
      </p>
      <p className={`mt-2 text-slate-700 ${compact ? "text-xs leading-relaxed" : "text-sm leading-relaxed"}`}>
        {template.aiFeature}
      </p>
    </div>
  );
}
