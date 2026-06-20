"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { listStudentBadges } from "@/lib/firebase/badges";
import type { StudentBadgeAward } from "@/lib/badges/types";
import { BadgeCircle } from "@/components/badges/BadgeIcon";

export function StudentBadgeBar() {
  const { user, role } = useAuth();
  const [badges, setBadges] = useState<StudentBadgeAward[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || role !== "student") {
      setBadges([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    listStudentBadges(user.uid)
      .then((list) => {
        if (!cancelled) setBadges(list);
      })
      .catch(() => {
        if (!cancelled) setBadges([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, role]);

  if (role !== "student") return null;

  return (
    <section className="mb-6 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50/80 to-orange-50/60 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-amber-900">나의 칭찬 배지</h2>
        {!loading && (
          <span className="text-xs text-amber-800/80">누적 {badges.length}개</span>
        )}
      </div>
      {loading && <p className="text-xs text-amber-800/70">배지 불러오는 중…</p>}
      {!loading && badges.length === 0 && (
        <p className="text-xs text-amber-900/70">아직 받은 칭찬 배지가 없습니다. 학습지를 성실히 작성해 보세요!</p>
      )}
      {!loading && badges.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {badges.map((badge) => (
            <BadgeCircle
              key={badge.id}
              iconKey={badge.iconKey}
              label={badge.badgeLabel}
              size="sm"
              title={badge.note ? `${badge.badgeLabel} — ${badge.note}` : badge.badgeLabel}
            />
          ))}
        </div>
      )}
    </section>
  );
}
