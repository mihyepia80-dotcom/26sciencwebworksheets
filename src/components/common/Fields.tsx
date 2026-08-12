"use client";

import type { ReactNode, TextareaHTMLAttributes } from "react";
import { MemoPad } from "@/components/common/MemoPad";

interface FieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  readOnly?: boolean;
  className?: string;
  /** 메모지 글틀 스타일 (기본 true — 학습지 답안) */
  memo?: boolean;
}

export type SectionColor =
  | "pink"
  | "blue"
  | "green"
  | "purple"
  | "yellow"
  | "orange"
  | "sky"
  | "teal"
  | "indigo"
  | "rose"
  | "amber"
  | "slate";

const SECTION_STYLES: Record<SectionColor, { shell: string; header: string }> = {
  pink: { shell: "border-rose-200/90 bg-rose-50/40", header: "border-rose-100 bg-rose-50/70" },
  blue: { shell: "border-blue-200/90 bg-blue-50/30", header: "border-blue-100 bg-blue-50/60" },
  green: { shell: "border-emerald-200/90 bg-emerald-50/30", header: "border-emerald-100 bg-emerald-50/60" },
  purple: { shell: "border-violet-200/90 bg-violet-50/30", header: "border-violet-100 bg-violet-50/60" },
  yellow: { shell: "border-amber-200/90 bg-amber-50/35", header: "border-amber-100 bg-amber-50/65" },
  orange: { shell: "border-orange-200/90 bg-orange-50/30", header: "border-orange-100 bg-orange-50/60" },
  sky: { shell: "border-sky-200/90 bg-sky-50/35", header: "border-sky-100 bg-sky-50/65" },
  teal: { shell: "border-teal-200/90 bg-teal-50/30", header: "border-teal-100 bg-teal-50/60" },
  indigo: { shell: "border-indigo-200/90 bg-indigo-50/30", header: "border-indigo-100 bg-indigo-50/60" },
  rose: { shell: "border-rose-200/90 bg-rose-50/30", header: "border-rose-100 bg-rose-50/60" },
  amber: { shell: "border-amber-200/90 bg-amber-50/30", header: "border-amber-100 bg-amber-50/60" },
  slate: { shell: "border-slate-200/90 bg-slate-50/50", header: "border-slate-100 bg-slate-50/80" },
};

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  readOnly,
  className = "",
  memo = true,
}: FieldProps) {
  const input = (
    <input
      type="text"
      className={`ui-input disabled:bg-slate-50 ${memo ? "ui-memo-pad ui-memo-pad--input" : ""}`}
      value={value}
      placeholder={placeholder}
      disabled={readOnly}
      onChange={(e) => onChange(e.target.value)}
    />
  );

  return (
    <div className={className}>
      {label && <label className="ui-label">{label}</label>}
      {memo ? <MemoPad inline>{input}</MemoPad> : input}
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 6,
  readOnly,
  className = "",
  memo = true,
}: FieldProps) {
  const textarea = (
    <textarea
      className={`ui-textarea disabled:bg-slate-50 ${memo ? "ui-memo-pad" : ""}`}
      value={value}
      placeholder={placeholder}
      rows={rows}
      disabled={readOnly}
      onChange={(e) => onChange(e.target.value)}
    />
  );

  return (
    <div className={`flex flex-col ${className}`}>
      {label && <label className="ui-label">{label}</label>}
      {memo ? <MemoPad inline={rows <= 2}>{textarea}</MemoPad> : textarea}
    </div>
  );
}

/** FieldBlock 등에서 직접 textarea를 쓸 때 메모지 글틀 래퍼 */
export function MemoTextArea({
  className = "",
  memo = true,
  rows = 6,
  readOnly,
  value,
  onChange,
  placeholder,
  ...rest
}: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value"> & {
  value: string;
  onChange: (value: string) => void;
  memo?: boolean;
}) {
  const textarea = (
    <textarea
      {...rest}
      rows={rows}
      className={`ui-textarea disabled:bg-slate-50 ${memo ? "ui-memo-pad" : ""} ${className}`.trim()}
      value={value}
      placeholder={placeholder}
      disabled={readOnly}
      onChange={(e) => onChange(e.target.value)}
    />
  );

  if (!memo) return textarea;
  return <MemoPad inline={(rows ?? 6) <= 2}>{textarea}</MemoPad>;
}

export function SectionBox({
  title,
  subtitle,
  badge,
  children,
  color = "blue",
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  children: ReactNode;
  color?: SectionColor;
}) {
  const styles = SECTION_STYLES[color];

  return (
    <section className={`ws-section overflow-hidden rounded-2xl border shadow-sm ${styles.shell}`}>
      <div className={`flex items-start gap-3 border-b px-5 py-4 ${styles.header}`}>
        {badge && (
          <span className="mt-0.5 shrink-0 rounded-md bg-indigo-600 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
            {badge}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">{title}</h2>
          {subtitle && <p className="mt-1 text-sm leading-relaxed text-slate-600">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-4 bg-white/80 p-5 backdrop-blur-[1px]">{children}</div>
    </section>
  );
}

export function GuideChips({
  chips,
  onSelect,
}: {
  chips: string[];
  onSelect: (text: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <button
          key={chip}
          type="button"
          className="ui-chip border border-indigo-200/80 bg-indigo-50 text-indigo-800 hover:bg-indigo-100"
          onClick={() => onSelect(chip)}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}

export function GridInput({
  keys,
  values,
  onChange,
  cols = 2,
  readOnly,
  cellClass = "",
}: {
  keys: string[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  cols?: number;
  readOnly?: boolean;
  cellClass?: string;
}) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {keys.map((key) => (
        <MemoPad key={key}>
          <textarea
            className={`ui-textarea ui-memo-pad min-h-[9rem] ${cellClass}`}
            value={values[key] ?? ""}
            disabled={readOnly}
            onChange={(e) => onChange(key, e.target.value)}
          />
        </MemoPad>
      ))}
    </div>
  );
}
