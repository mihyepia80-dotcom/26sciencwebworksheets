"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SharedInquiryReportView } from "@/components/inquiry-report/SharedInquiryReportView";
import { getInquiryReportShareByToken } from "@/lib/firebase/inquiry-report-shares";

export default function InquiryReportSharePage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [form, setForm] = useState<Parameters<typeof SharedInquiryReportView>[0]["form"] | null>(null);

  useEffect(() => {
    params.then(({ token: t }) => setToken(t));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setError("");

    getInquiryReportShareByToken(token)
      .then((record) => {
        if (cancelled) return;
        if (!record) {
          setError("공유 링크를 찾을 수 없거나 만료되었습니다.");
          return;
        }
        setTitle(record.title);
        setForm(record.form);
      })
      .catch(() => {
        if (!cancelled) setError("탐구보고서를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-4 print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <Link href="/" className="text-sm font-bold text-slate-800">
            사고도구 톡톡
          </Link>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-900"
            >
              PDF로 저장
            </button>
          </div>
        </div>
      </header>

      {loading && <p className="py-16 text-center text-sm text-slate-500">불러오는 중...</p>}
      {error && <p className="py-16 text-center text-sm text-red-600">{error}</p>}
      {form && <SharedInquiryReportView form={form} title={title} />}
    </div>
  );
}
