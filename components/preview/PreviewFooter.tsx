"use client";

import { useWizardStore } from "@/lib/store/wizardStore";
import { VERSION_MARKER } from "@/lib/dotx/bookmarks";
import type { Location } from "@/lib/store/wizardStore";

function LocationBlock({ loc }: { loc: Location }) {
  return (
    <div className="flex-1 text-center">
      {loc.name && (
        <p className="font-semibold text-brand-dark">{loc.name.toUpperCase()}</p>
      )}
      {loc.address && <p>{loc.address}</p>}
      {(loc.phone || loc.fax) && (
        <p>
          {[loc.phone && `Office: ${loc.phone}`, loc.fax && `Fax: ${loc.fax}`]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
    </div>
  );
}

export function PreviewFooter({ pageLabel }: { pageLabel: string }) {
  const locations = useWizardStore((s) => s.locations);
  const facilityInfo = useWizardStore((s) => s.facilityInfo);

  return (
    <div className="mt-auto border-t border-brand-dark/40 pt-2 text-[10px] leading-snug text-muted">
      {locations.length > 0 ? (
        <div className="flex divide-x divide-border">
          {locations.map((loc) => (
            <LocationBlock key={loc.id} loc={loc} />
          ))}
        </div>
      ) : (
        <p className="text-center">Add a location to see it here</p>
      )}

      {facilityInfo.tagline && (
        <p className="mt-1 text-center text-[10px] font-semibold italic text-text">
          {facilityInfo.tagline}
        </p>
      )}
      {facilityInfo.website && (
        <p className="text-center text-brand-dark">{facilityInfo.website}</p>
      )}

      <div className="mt-1 flex items-center justify-between text-[9px] text-muted/70">
        <span>{VERSION_MARKER}</span>
        <span>{pageLabel}</span>
      </div>
    </div>
  );
}
