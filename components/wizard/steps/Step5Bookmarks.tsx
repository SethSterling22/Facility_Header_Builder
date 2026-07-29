"use client";

import { useWizardStore } from "@/lib/store/wizardStore";
import {
  BOOKMARK_CATEGORIES,
  BOOKMARK_DEFINITIONS,
} from "@/lib/dotx/bookmarks";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export function Step5Bookmarks() {
  const included = useWizardStore((s) => s.bookmarkConfig.included);
  const toggleBookmark = useWizardStore((s) => s.toggleBookmark);

  return (
    <Card>
      <CardHeader title="Report Fields" />
      <CardBody>
        <p className="mb-5 text-sm text-muted">
          These are the fields RamSoft can automatically fill in on every
          report. Choose which ones appear in your patient-data table — field
          names themselves are fixed by RamSoft and can&apos;t be renamed.
        </p>

        {BOOKMARK_CATEGORIES.map((category) => {
          const defs = BOOKMARK_DEFINITIONS.filter(
            (b) => b.category === category && !b.fullWidth,
          );
          if (defs.length === 0) return null;
          return (
            <div key={category} className="mb-5 last:mb-0">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                {category}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {defs.map((def) => {
                  const checked = included.includes(def.name);
                  return (
                    <label
                      key={def.name}
                      className="flex items-center gap-2.5 rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-text"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          toggleBookmark(def.name, e.target.checked)
                        }
                        className="h-4 w-4 accent-brand-blue"
                      />
                      {def.label}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-muted">
          <input type="checkbox" checked disabled className="h-4 w-4" />
          Report Body — always included, filled in by the reading radiologist
        </div>
      </CardBody>
    </Card>
  );
}
