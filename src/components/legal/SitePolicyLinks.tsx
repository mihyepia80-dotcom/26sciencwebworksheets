import Link from "next/link";
import { SITE_POLICIES } from "@/lib/legal/policies";

export function SitePolicyLinks() {
  return (
    <section className="mt-16 border-t border-slate-200/80 pt-10" aria-labelledby="policy-links-heading">
      <h2 id="policy-links-heading" className="ui-section-title">
        서비스 정책
      </h2>
      <p className="ui-section-desc">
        개인정보, 이용 조건, AI 이용 안내를 확인할 수 있습니다.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {SITE_POLICIES.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="ui-panel block transition hover:border-violet-200 hover:shadow-lg"
          >
            <p className="text-xl font-bold text-slate-900">{item.label}</p>
            <p className="mt-2 text-base text-slate-600">{item.description}</p>
            <span className="mt-4 inline-block text-base font-semibold text-violet-700">전문 보기 →</span>
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
