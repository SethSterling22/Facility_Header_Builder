"use client";

import { useWizardStore } from "@/lib/store/wizardStore";
import { VERSION_MARKER } from "@/lib/dotx/bookmarks";

export function PreviewFooter({ pageLabel }: { pageLabel: string }) {
  const locations = useWizardStore((s) => s.locations);
  const facilityInfo = useWizardStore((s) => s.facilityInfo);

  return (
    <div className="mt-auto border-t border-text/20 pt-2 text-[10px] leading-snug text-muted">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-6">
          {locations.length > 0 ? (
            locations.map((loc) => (
              <div key={loc.id}>
                {loc.name && (
                  <p className="font-semibold text-text">
                    {loc.name.toUpperCase()}
                  </p>
                )}
                {loc.address && <p>{loc.address}</p>}
                {(loc.phone || loc.fax) && (
                  <p>
                    {[
                      loc.phone && `Office: ${loc.phone}`,
                      loc.fax && `Fax: ${loc.fax}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p>
              {facilityInfo.phone
                ? `Office: ${facilityInfo.phone}`
                : "Add a location to see it here"}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p>{pageLabel}</p>
          <p className="font-semibold">{VERSION_MARKER}</p>
        </div>
      </div>
    </div>
  );
}
