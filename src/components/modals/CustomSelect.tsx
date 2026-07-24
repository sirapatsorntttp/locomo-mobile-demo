"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface CustomSelectProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CustomSelect({
  value,
  options,
  onChange,
  placeholder = "เลือกข้อมูล",
  disabled = false,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);

  const handleToggle = () => {
    if (disabled) return;
    setOpen((current) => !current);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm transition ${
          disabled
            ? "cursor-not-allowed bg-slate-100 text-slate-400"
            : "text-slate-700 hover:bg-slate-50"
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate text-left ${
            value ? "text-slate-700" : "text-slate-400"
          }`}
        >
          {value || placeholder}
        </span>

        <ChevronDown
          size={16}
          className={`ml-2 shrink-0 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-400">
              ไม่มีตัวเลือก
            </div>
          ) : (
            options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-sm transition ${
                  value === opt
                    ? "bg-blue-50 font-semibold text-blue-600"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {opt}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
