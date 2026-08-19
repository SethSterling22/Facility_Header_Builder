"use client";

import { useWizardStore } from "@/lib/store/wizardStore";
import {
  BOOKMARK_CATEGORIES,
  BOOKMARK_DEFINITIONS,
} from "@/lib/dotx/bookmarks";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";

export function Step5Bookmarks() {
  const included = useWizardStore((s) => s.bookmarkConfig.included);
  const includeAddendum = useWizardStore(
    (s) => s.bookmarkConfig.includeAddendum,
  );
  const toggleBookmark = useWizardStore((s) => s.toggleBookmark);
  const setIncludeAddendum = useWizardStore((s) => s.setIncludeAddendum);

  return (
    <Card>
      <CardHeader title="Report Fields" />
      <CardBody>
        <p className="mb-5 text-sm text-muted">
          These are the fields RamSoft fills in automatically on every report.
          Choose which ones appear in your patient-data table — the field names
          themselves are fixed by RamSoft and can&apos;t be renamed.
        </p>

        {BOOKMARK_CATEGORIES.map((category) => {
          const defs = BOOKMARK_DEFINITIONS.filter(
            (b) => b.category === category,
          );
          if (defs.length === 0) return null;
          return (
            <div key={category} className="mb-5">
              <p className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
                {category}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {defs.map((def) => (
                  <label
                    key={def.name}
                    className="flex items-center gap-2.5 rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-text"
                  >
                    <input
                      type="checkbox"
                      checked={included.includes(def.name)}
                      onChange={(e) =>
                        toggleBookmark(def.name, e.target.checked)
                      }
                      className="h-4 w-4 accent-brand-blue"
                    />
                    {def.label}
                  </label>
                ))}
              </div>
            </div>
          );
        })}

        <div className="mb-3 flex items-center gap-2.5 rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-muted">
          <input type="checkbox" checked disabled className="h-4 w-4" />
          Report Body — always included, filled in by the reading radiologist
        </div>

        <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-bg p-4">
          <div>
            <p className="text-sm font-semibold text-text">
              Show addenda at the top of the report
            </p>
            <p className="mt-1 text-xs text-muted">
              Adds the optional <code>Addendum</code> field ahead of the report
              body, so any addendum prints above the findings instead of at the
              very bottom.
            </p>
          </div>
          <Toggle checked={includeAddendum} onChange={setIncludeAddendum} />
        </div>
      </CardBody>
    </Card>
  );
}
