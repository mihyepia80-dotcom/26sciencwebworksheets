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
      {label && <label className="mb-1 block text-xs font-semibold text-slate-600">{label}</label>}
      <input
        type="text"
        className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-slate-50"
        value={value}
        placeholder={placeholder}
        disabled={readOnly}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function TextAreaField({ label, value, onChange, placeholder, rows = 4, readOnly, className = "" }: FieldProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && <label className="mb-1 block text-xs font-semibold text-slate-600">{label}</label>}
      <textarea
        className="min-h-[80px] flex-1 resize-y rounded border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-slate-50"
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
    pink: "bg-pink-100 border-pink-200",
    blue: "bg-blue-100 border-blue-200",
    green: "bg-green-100 border-green-200",
    purple: "bg-purple-100 border-purple-200",
    yellow: "bg-yellow-100 border-yellow-200",
    orange: "bg-orange-100 border-orange-200",
  };

  return (
    <div className={`overflow-hidden rounded-lg border-2 ${colors[color]}`}>
      <div className={`px-4 py-2 text-sm font-bold text-slate-800 ${colors[color]}`}>{title}</div>
      <div className="bg-amber-50/30 p-4">{children}</div>
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
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <button
          key={chip}
          type="button"
          className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs text-blue-700 transition hover:bg-blue-100"
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
    <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {keys.map((key) => (
        <textarea
          key={key}
          className={`min-h-[72px] resize-y rounded border border-slate-200 bg-white px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none ${cellClass}`}
          value={values[key] ?? ""}
          disabled={readOnly}
          onChange={(e) => onChange(key, e.target.value)}
        />
      ))}
    </div>
  );
}
