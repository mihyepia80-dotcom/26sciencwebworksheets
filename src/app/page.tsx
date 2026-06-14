import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { getSortedTemplates, CATEGORY_LABELS } from "@/lib/templates/registry";

export default function HomePage() {
  const templates = getSortedTemplates();
  const categories = [...new Set(templates.map((t) => t.category))];

  return (
    <div className="min-h-screen">
      <AppHeader
        title="사고도구 톡톡"
        subtitle={`사고 전략 기법 활동지 · ${templates.length}개 템플릿`}
      />

      <main className="mx-auto max-w-6xl px-4 py-8">
        {categories.map((cat) => {
          const items = templates.filter((t) => t.category === cat);
          return (
            <section key={cat} className="mb-10">
              <h2 className="mb-4 text-lg font-bold text-slate-800">
                {CATEGORY_LABELS[cat] ?? cat}
                <span className="ml-2 text-sm font-normal text-slate-400">({items.length})</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((t) => (
                  <Link
                    key={t.id}
                    href={`/templates/${t.id}`}
                    className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-slate-800 group-hover:text-blue-700">{t.name}</h3>
                      <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        {t.order}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{t.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
