"use client";
// components/optimizer/ExportMenu.tsx
import { useState, useRef, useEffect } from "react";
import { Download, FileText, FileJson, FileSpreadsheet, FileCode } from "lucide-react";

interface ExportMenuProps {
  href: (format: "sql" | "json" | "csv" | "pdf") => string;
  label?: string;
  align?: "left" | "right";
  formats?: Array<"sql" | "json" | "csv" | "pdf">;
  className?: string;
}

const ALL_FORMATS: Array<{ key: "sql" | "json" | "csv" | "pdf"; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: "sql", label: "SQL file (.sql)", icon: FileCode },
  { key: "json", label: "JSON (.json)", icon: FileJson },
  { key: "csv", label: "CSV (.csv)", icon: FileSpreadsheet },
  { key: "pdf", label: "PDF report (.pdf)", icon: FileText },
];

export function ExportMenu({ href, label, align = "right", formats, className }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const FORMATS = formats ? ALL_FORMATS.filter((f) => formats.includes(f.key)) : ALL_FORMATS;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className={className ?? (label
          ? "flex items-center gap-1.5 px-3 py-1.5 border border-violet-500/25 text-slate-300 text-[11px] font-medium rounded-lg hover:border-violet-500/45 transition-colors"
          : "p-1.5 rounded-lg hover:bg-violet-500/10")}
        title="Export"
      >
        <Download className="w-4 h-4 text-slate-400" />
        {label && <span>{label}</span>}
      </button>
      {open && (
        <div
          className={`absolute ${align === "right" ? "right-0" : "left-0"} mt-1 w-44 bg-[#0a0a14] border border-violet-500/25 rounded-xl shadow-xl shadow-black/40 overflow-hidden z-30`}
          onClick={(e) => e.stopPropagation()}
        >
          {FORMATS.map(({ key, label: flabel, icon: Icon }) => (
            <a
              key={key}
              href={href(key)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-[12px] text-slate-300 hover:bg-violet-500/10 hover:text-white transition-colors"
            >
              <Icon className="w-3.5 h-3.5 text-violet-400" />
              {flabel}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
