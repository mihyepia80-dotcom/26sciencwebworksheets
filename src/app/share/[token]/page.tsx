"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SharedWorksheetView } from "@/components/SharedWorksheetView";
import { getShareByToken } from "@/lib/firebase/shares";
import type { ShareRecord } from "@/lib/firebase/shares";

export default function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string | null>(null);
  const [share, setShare] = useState<ShareRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then(({ token: t }) => setToken(t));
  }, [params]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    getShareByToken(token)
      .then((record) => {
        if (cancelled) return;
        if (!record) {
          setError("공유 링크를 찾을 수 없거나 만료되었습니다.");
          return;
        }
        setShare(record);
      })
      .catch(() => {
        if (!cancelled) setError("활동지를 불러오지 못했습니다.");
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
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="text-sm font-bold text-slate-800">
            사고도구 톡톡
          </Link>
          <span className="text-xs text-slate-500">공유 활동지</span>
        </div>
      </header>

      {loading && (
        <p className="px-4 py-16 text-center text-sm text-slate-500">불러오는 중...</p>
      )}
      {error && (
        <p className="px-4 py-16 text-center text-sm text-red-600">{error}</p>
      )}
      {share && <SharedWorksheetView share={share} />}
    </div>
  );
}
