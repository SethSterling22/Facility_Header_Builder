"use client";

import { RotateCcw } from "lucide-react";

export function Slider({
  label,
  value,
  defaultValue,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs tabular-nums text-text">
            {value.toFixed(2)}
          </span>
          <button
            type="button"
            onClick={() => onChange(defaultValue)}
            className="text-muted hover:text-brand-blue"
            aria-label={`Reset ${label}`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand-blue"
      />
    </div>
  );
}
