"use client";

import type { ReactNode } from "react";
import { ROSTER_TABLE_MAX_HEIGHT } from "@/lib/group-activity/prd";

interface RosterScrollTableProps {
  stickyNoLabel?: string;
  stickyNameLabel?: string;
  children: ReactNode;
}

/** 번호·이름 열 고정 + 세로 스크롤 (엑셀 틀 고정과 유사) */
export function RosterScrollTable({
  stickyNoLabel = "번호",
  stickyNameLabel = "이름",
  children,
}: RosterScrollTableProps) {
  return (
    <div
      className="mt-4 overflow-auto rounded-lg border border-slate-200"
      style={{ maxHeight: ROSTER_TABLE_MAX_HEIGHT }}
    >
      <table className="min-w-full border-collapse text-sm">
        {children}
      </table>
    </div>
  );
}

export function RosterStickyHead({
  noLabel = "번호",
  nameLabel = "이름",
  extraHeaders,
}: {
  noLabel?: string;
  nameLabel?: string;
  extraHeaders: ReactNode;
}) {
  return (
    <thead className="sticky top-0 z-30 bg-slate-50 shadow-sm">
      <tr className="border-b text-left text-slate-600">
        <th className="sticky left-0 z-40 min-w-[4.5rem] border-r border-slate-200 bg-slate-50 px-3 py-2">
          {noLabel}
        </th>
        <th className="sticky left-[4.5rem] z-40 min-w-[7rem] border-r border-slate-200 bg-slate-50 px-3 py-2">
          {nameLabel}
        </th>
        {extraHeaders}
      </tr>
    </thead>
  );
}

export function RosterStickyRow({
  studentNo,
  studentName,
  cells,
}: {
  studentNo: string;
  studentName: string;
  cells: ReactNode;
}) {
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/80">
      <td className="sticky left-0 z-20 min-w-[4.5rem] border-r border-slate-100 bg-white px-3 py-2 font-medium">
        {studentNo}
      </td>
      <td className="sticky left-[4.5rem] z-20 min-w-[7rem] border-r border-slate-100 bg-white px-3 py-2">
        {studentName}
      </td>
      {cells}
    </tr>
  );
}
