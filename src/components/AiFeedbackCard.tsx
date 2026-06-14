import type { AiRating } from "@/lib/ai/feedback";
import { RATING_STYLES } from "@/lib/ai/feedback";

export function AiFeedbackCard({ rating, feedback }: { rating: AiRating; feedback: string }) {
  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-bold text-violet-900">AI 피드백</h3>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${RATING_STYLES[rating]}`}>
          {rating}
        </span>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{feedback}</p>
    </div>
  );
}
