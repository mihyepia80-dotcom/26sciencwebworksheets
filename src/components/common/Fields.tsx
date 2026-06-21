"use client";

interface FieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  readOnly?: boolean;
  className?: string;
}

export function TextField({ label, value, onChange, placeholder, readOnly, className = "" }: FieldProps) {
  return (
    <div className={className}>
      {label && <label className="ui-label">{label}</label>}
      <input
        type="text"
        className="ui-input disabled:bg-slate-50"
        value={value}
        placeholder={placeholder}
        disabled={readOnly}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function TextAreaField({ label, value, onChange, placeholder, rows = 6, readOnly, className = "" }: FieldProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && <label className="ui-label">{label}</label>}
      <textarea
        className="ui-textarea disabled:bg-slate-50"
        value={value}
        placeholder={placeholder}
        rows={rows}
        disabled={readOnly}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function SectionBox({
  title,
  children,
  color = "pink",
}: {
  title: string;
  children: React.ReactNode;
  color?: "pink" | "blue" | "green" | "purple" | "yellow" | "orange";
}) {
  const colors = {
    pink: "border-rose-100 bg-rose-50/50",
    blue: "border-blue-100 bg-blue-50/50",
    green: "border-emerald-100 bg-emerald-50/50",
    purple: "border-violet-100 bg-violet-50/50",
    yellow: "border-amber-100 bg-amber-50/50",
    orange: "border-orange-100 bg-orange-50/50",
  };

  return (
    <div className={`overflow-hidden rounded-2xl border ${colors[color]}`}>
      <div className="border-b border-inherit px-5 py-3 text-base font-bold text-slate-800">{title}</div>
      <div className="bg-white/60 p-5">{children}</div>
    </div>
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
          className="ui-chip border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
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
        <textarea
          key={key}
          className={`ui-textarea min-h-[9rem] ${cellClass}`}
          value={values[key] ?? ""}
          disabled={readOnly}
          onChange={(e) => onChange(key, e.target.value)}
        />
      ))}
    </div>
  );
}
