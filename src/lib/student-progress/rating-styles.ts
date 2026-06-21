import type { AiRating } from "@/lib/ai/feedback";
import type { TemplateProgress, TemplateProgressStatus } from "./types";

export interface ProgressVisualStyle {
  card: string;
  badge: string;
  dot: string;
  label: string;
  navActive: string;
  navIdle: string;
}

const NONE: ProgressVisualStyle = {
  card: "border-slate-200 bg-white hover:border-slate-300",
  badge: "bg-slate-100 text-slate-600",
  dot: "bg-slate-300",
  label: "미완료",
  navActive: "border-slate-300 bg-slate-100 text-slate-800",
  navIdle: "border-transparent text-slate-600 hover:bg-slate-50",
};

const DRAFT: ProgressVisualStyle = {
  card: "border-sky-200 bg-sky-50/40 hover:border-sky-300",
  badge: "bg-sky-100 text-sky-800",
  dot: "bg-sky-500",
  label: "작성 중",
  navActive: "border-sky-400 bg-sky-50 text-sky-900",
  navIdle: "border-transparent text-sky-800 hover:bg-sky-50",
};

const RATING_STYLES: Record<AiRating, ProgressVisualStyle> = {
  잘함: {
    card: "border-emerald-200 bg-emerald-50/40 hover:border-emerald-300",
    badge: "bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-500",
    label: "완료 · 잘함",
    navActive: "border-emerald-400 bg-emerald-50 text-emerald-900",
    navIdle: "border-transparent text-emerald-800 hover:bg-emerald-50",
  },
  보통: {
    card: "border-amber-200 bg-amber-50/40 hover:border-amber-300",
    badge: "bg-amber-100 text-amber-900",
    dot: "bg-amber-400",
    label: "완료 · 보통",
    navActive: "border-amber-400 bg-amber-50 text-amber-900",
    navIdle: "border-transparent text-amber-900 hover:bg-amber-50",
  },
  노력요함: {
    card: "border-red-200 bg-red-50/40 hover:border-red-300",
    badge: "bg-red-100 text-red-800",
    dot: "bg-red-400",
    label: "완료 · 노력요함",
    navActive: "border-red-400 bg-red-50 text-red-900",
    navIdle: "border-transparent text-red-800 hover:bg-red-50",
  },
};

const SUBMITTED_NO_RATING: ProgressVisualStyle = {
  card: "border-emerald-200 bg-emerald-50/30 hover:border-emerald-300",
  badge: "bg-emerald-100 text-emerald-800",
  dot: "bg-emerald-400",
  label: "완료",
  navActive: "border-emerald-300 bg-emerald-50 text-emerald-900",
  navIdle: "border-transparent text-emerald-800 hover:bg-emerald-50",
};

export function getProgressVisualStyle(
  status: TemplateProgressStatus,
  aiRating: AiRating | null,
): ProgressVisualStyle {
  if (status === "none") return NONE;
  if (status === "draft") return DRAFT;
  if (aiRating && RATING_STYLES[aiRating]) return RATING_STYLES[aiRating];
  return SUBMITTED_NO_RATING;
}

export function getProgressVisualFromProgress(progress?: TemplateProgress): ProgressVisualStyle {
  if (!progress || progress.status === "none") return NONE;
  return getProgressVisualStyle(progress.status, progress.aiRating);
}
