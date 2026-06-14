"use client";

import type { WorksheetSubmission } from "@/lib/firebase/submissions";
import type { AiRating } from "@/lib/ai/feedback";
import { RATING_STYLES } from "@/lib/ai/feedback";

function formatDateKey(submission: WorksheetSubmission): string {
  if (!submission.submittedAt) return "날짜 없음";
  return submission.submittedAt.toDate().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function formatTime(submission: WorksheetSubmission): string {
  if (!submission.submittedAt) return "-";
  return submission.submittedAt.toDate().toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupByDate(submissions: WorksheetSubmission[]): Map<string, WorksheetSubmission[]> {
  const map = new Map<string, WorksheetSubmission[]>();
  for (const submission of submissions) {
    const key = formatDateKey(submission);
    const list = map.get(key) ?? [];
    list.push(submission);
    map.set(key, list);
  }
  return map;
}

export function TeacherDailyTable({ submissions }: { submissions: WorksheetSubmission[] }) {
  const grouped = groupByDate(submissions);

  if (submissions.length === 0) {
    return (
      <p className="mt-8 rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        아직 제출된 활동지가 없습니다.
      </p>
    );
  }

  return (
    <div className="mt-8 space-y-8">
      <h2 className="text-lg font-bold text-slate-800">날짜별 제출 현황</h2>
      {[...grouped.entries()].map(([date, items]) => (
        <section key={date} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <h3 className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
            {date}
            <span className="ml-2 font-normal text-slate-500">({items.length}건)</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="px-4 py-3 font-semibold">시간</th>
                  <th className="px-4 py-3 font-semibold">학년</th>
                  <th className="px-4 py-3 font-semibold">반</th>
                  <th className="px-4 py-3 font-semibold">번호</th>
                  <th className="px-4 py-3 font-semibold">이름</th>
                  <th className="px-4 py-3 font-semibold">활동지</th>
                  <th className="px-4 py-3 font-semibold">주제</th>
                  <th className="px-4 py-3 font-semibold">평어</th>
                </tr>
              </thead>
              <tbody>
                {items.map((submission) => {
                  const rating = submission.aiRating;
                  return (
                    <tr key={submission.id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-600">{formatTime(submission)}</td>
                      <td className="px-4 py-3">{submission.meta.grade || "-"}</td>
                      <td className="px-4 py-3">{submission.meta.classNo || "-"}</td>
                      <td className="px-4 py-3">{submission.meta.studentNo || "-"}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{submission.meta.studentName || "-"}</td>
                      <td className="px-4 py-3 text-slate-700">{submission.templateName}</td>
                      <td className="px-4 py-3 text-slate-600">{submission.meta.topic || "-"}</td>
                      <td className="px-4 py-3">
                        {rating ? (
                          <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${RATING_STYLES[rating]}`}>
                            {rating}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
