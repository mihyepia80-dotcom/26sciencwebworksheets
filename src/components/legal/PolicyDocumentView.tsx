import Link from "next/link";
import type { ReactNode } from "react";
import type { PolicyDocument } from "@/lib/legal/policies";

export function PolicyDocumentView({ policy }: { policy: PolicyDocument }) {
  return (
    <article className="ui-card p-6 sm:p-8">
      <p className="text-sm text-slate-500">시행일: {policy.updatedAt}</p>
      <p className="mt-3 text-base leading-relaxed text-slate-700">{policy.summary}</p>

      <div className="mt-8 space-y-8">
        {policy.sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-sm leading-relaxed text-slate-700">
                {paragraph}
              </p>
            ))}
            {section.bullets && (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}

export function PolicyPageShell({
  policy,
  children,
}: {
  policy: PolicyDocument;
  children?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-5 py-6">
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            ← 메인으로
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">{policy.title}</h1>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-8">
        <PolicyDocumentView policy={policy} />
        {children}
      </main>
    </div>
  );
}
