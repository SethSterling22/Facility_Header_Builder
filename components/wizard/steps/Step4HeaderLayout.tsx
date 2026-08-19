"use client";

import clsx from "clsx";
import { useWizardStore } from "@/lib/store/wizardStore";
import type {
  ContactPlacement,
  ExpertRadiologyPlacement,
  HeaderArrangement,
} from "@/lib/store/wizardStore";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";

const ARRANGEMENTS: { value: HeaderArrangement; label: string; hint: string }[] = [
  {
    value: "logo-only",
    label: "Logo only",
    hint: "Just the logo, centered. The most common choice.",
  },
  {
    value: "logo-centered-stacked",
    label: "Centered, stacked",
    hint: "Logo centered above the facility name.",
  },
  {
    value: "logo-left-name-right",
    label: "Logo left, name right",
    hint: "Logo on the left, facility name aligned right.",
  },
];

const CONTACT_PLACEMENTS: {
  value: ContactPlacement;
  label: string;
  hint: string;
}[] = [
  {
    value: "footer",
    label: "Footer (recommended)",
    hint: "Address and phone appear at the bottom of every page.",
  },
  {
    value: "header",
    label: "Header",
    hint: "Address and phone sit directly under the logo.",
  },
];

const EXPERT_PLACEMENTS: {
  value: ExpertRadiologyPlacement;
  label: string;
}[] = [
  { value: "footer", label: "Footer" },
  { value: "header", label: "Header" },
  { value: "beside-logo", label: "Beside your logo" },
];

function OptionGrid<T extends string>({
  options,
  selected,
  onSelect,
  columns,
}: {
  options: { value: T; label: string; hint?: string }[];
  selected: T;
  onSelect: (value: T) => void;
  columns: string;
}) {
  return (
    <div className={clsx("grid grid-cols-1 gap-3", columns)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onSelect(option.value)}
          className={clsx(
            "rounded-lg border p-4 text-left transition-colors",
            selected === option.value
              ? "border-brand-blue bg-brand-light"
              : "border-border bg-white hover:border-brand-blue",
          )}
        >
          <p className="text-sm font-semibold text-text">{option.label}</p>
          {option.hint && (
            <p className="mt-1 text-xs text-muted">{option.hint}</p>
          )}
        </button>
      ))}
    </div>
  );
}

export function Step4HeaderLayout() {
  const headerLayout = useWizardStore((s) => s.headerLayout);
  const setHeaderLayout = useWizardStore((s) => s.setHeaderLayout);
  const expertRadiology = useWizardStore((s) => s.expertRadiology);
  const setExpertRadiology = useWizardStore((s) => s.setExpertRadiology);

  return (
    <Card>
      <CardHeader title="Header & Footer Layout" />
      <CardBody>
        <p className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">
          Header arrangement
        </p>
        <OptionGrid
          options={ARRANGEMENTS}
          selected={headerLayout.arrangement}
          onSelect={(arrangement) => setHeaderLayout({ arrangement })}
          columns="sm:grid-cols-3"
        />

        <p className="mt-6 mb-3 text-xs font-semibold tracking-wide text-muted uppercase">
          Where should your address &amp; phone appear?
        </p>
        <OptionGrid
          options={CONTACT_PLACEMENTS}
          selected={headerLayout.contactPlacement}
          onSelect={(contactPlacement) => setHeaderLayout({ contactPlacement })}
          columns="sm:grid-cols-2"
        />

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

        <div className="mt-4 rounded-lg border border-border bg-bg p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-text">
                Include Expert Radiology&apos;s contact info
              </p>
              <p className="mt-1 text-xs text-muted">
                Off by default — this template is branded for your facility.
                Only turn it on if it was specifically requested.
              </p>
            </div>
            <Toggle
              checked={expertRadiology.include}
              onChange={(include) => setExpertRadiology({ include })}
            />
          </div>

          {expertRadiology.include && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
                Placement
              </p>
              <OptionGrid
                options={EXPERT_PLACEMENTS}
                selected={expertRadiology.placement}
                onSelect={(placement) => setExpertRadiology({ placement })}
                columns="sm:grid-cols-3"
              />
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
