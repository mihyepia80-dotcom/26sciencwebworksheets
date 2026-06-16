import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { AiFeaturePanel } from "@/components/AiFeaturePanel";
import { getCategoryGroups, getSortedTemplates } from "@/lib/templates/registry";

export default function HomePage() {
  const templates = getSortedTemplates();
  const groups = getCategoryGroups();

  return (
    <div className="min-h-screen">
      <AppHeader
        title="사고도구 톡톡"
        subtitle={`과학 탐구 글쓰기 학습지 · ${templates.length}개 사고도구`}
      />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <section className="mb-10">
          <Link
            href="/inquiry-report"
            className="block rounded-xl border-2 border-violet-200 bg-gradient-to-r from-violet-50 to-blue-50 p-6 shadow-sm transition hover:border-violet-300 hover:shadow-md"
          >
            <h2 className="text-xl font-bold text-violet-900">학생용 탐구보고서</h2>
            <p className="mt-2 text-sm text-slate-600">
              실험 제목·준비물·과정·결과·결론을 작성해 제출하세요.
            </p>
          </Link>
        </section>

        {groups.map((group) => (
          <section key={group.id} className="mb-10">
            <h2 className="text-lg font-bold text-slate-800">
              {group.label}
              <span className="ml-2 text-sm font-normal text-slate-400">({group.templates.length})</span>
            </h2>
            {group.subtitle && <p className="mb-4 text-sm text-slate-500">{group.subtitle}</p>}
            {!group.subtitle && <div className="mb-4" />}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.templates.map((t) => (
                <Link
                  key={t.id}
                  href={`/templates/${t.id}`}
                  className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                >
                  <h3 className="font-semibold text-slate-800 group-hover:text-blue-700">{t.name}</h3>
                  {t.nameEn && <p className="mt-0.5 text-xs text-slate-400">{t.nameEn}</p>}
                  <p className="mt-1 text-sm text-slate-500">{t.description}</p>
                  {t.aiFeatureLabel && (
                    <p className="mt-2 text-xs font-medium text-violet-700">[{t.aiFeatureLabel}]</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
