import Link from "next/link";
import { SITE_POLICIES } from "@/lib/legal/policies";

export function SitePolicyLinks() {
  return (
    <section className="mt-16 border-t border-slate-200 pt-10" aria-labelledby="policy-links-heading">
      <h2 id="policy-links-heading" className="text-lg font-bold text-slate-900">
        서비스 정책
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        개인정보, 이용 조건, AI 이용 안내를 확인할 수 있습니다.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {SITE_POLICIES.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="ui-card block p-4 transition hover:border-violet-200 hover:shadow-sm"
          >
            <p className="font-semibold text-slate-900">{item.label}</p>
            <p className="mt-1 text-sm text-slate-600">{item.description}</p>
            <span className="mt-3 inline-block text-sm font-medium text-violet-700">전문 보기 →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function SitePolicyFooter() {
  return (
    <footer className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
      {SITE_POLICIES.map((item, index) => (
        <span key={item.href} className="inline-flex items-center gap-4">
          {index > 0 && <span className="hidden sm:inline text-slate-300">|</span>}
          <Link href={item.href} className="hover:text-slate-800 hover:underline">
            {item.label}
          </Link>
        </span>
      ))}
    </footer>
  );
}
