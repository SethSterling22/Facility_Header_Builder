"use client";

import clsx from "clsx";
import { useWizardStore } from "@/lib/store/wizardStore";
import type { HeaderArrangement } from "@/lib/store/wizardStore";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";

const ARRANGEMENTS: { value: HeaderArrangement; label: string; hint: string }[] = [
  {
    value: "logo-left-address-right",
    label: "Logo left, name right",
    hint: "Logo on the left, facility name and tagline aligned right.",
  },
  {
    value: "logo-centered-stacked",
    label: "Centered, stacked",
    hint: "Logo centered above the facility name and tagline.",
  },
  {
    value: "logo-only",
    label: "Logo only",
    hint: "Just the logo, centered — no facility name in the header.",
  },
];

export function Step4HeaderLayout() {
  const headerLayout = useWizardStore((s) => s.headerLayout);
  const setHeaderLayout = useWizardStore((s) => s.setHeaderLayout);

  return (
    <Card>
      <CardHeader title="Header Layout" />
      <CardBody>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
          Arrangement
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {ARRANGEMENTS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                setHeaderLayout({ arrangement: option.value })
              }
              className={clsx(
                "rounded-lg border p-4 text-left transition-colors",
                headerLayout.arrangement === option.value
                  ? "border-brand-blue bg-brand-light"
                  : "border-border bg-white hover:border-brand-blue",
              )}
            >
              <p className="text-sm font-semibold text-text">
                {option.label}
              </p>
              <p className="mt-1 text-xs text-muted">{option.hint}</p>
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-start justify-between gap-4 rounded-lg border border-border bg-bg p-4">
          <div>
            <p className="text-sm font-semibold text-text">
              Different header for page 1
            </p>
            <p className="mt-1 text-xs text-muted">
              Show your full branding on page 1, and a condensed strip
              (facility name only) on every page after that.
            </p>
          </div>
          <Toggle
            checked={headerLayout.pageOneDifferent}
            onChange={(pageOneDifferent) =>
              setHeaderLayout({ pageOneDifferent })
            }
          />
        </div>
      </CardBody>
    </Card>
  );
}
