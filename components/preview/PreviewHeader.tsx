"use client";

import { useWizardStore } from "@/lib/store/wizardStore";
import { VERSION_MARKER } from "@/lib/dotx/bookmarks";

export function PreviewHeader({ variant }: { variant: "first" | "default" }) {
  const facilityInfo = useWizardStore((s) => s.facilityInfo);
  const logo = useWizardStore((s) => s.logo);
  const headerLayout = useWizardStore((s) => s.headerLayout);

  const isCondensed = variant === "default" && headerLayout.pageOneDifferent;
  const name = facilityInfo.name || "Your Facility Name";

  if (isCondensed) {
    return (
      <div className="flex items-center justify-between border-b border-text/20 pb-2 text-[11px] text-muted">
        <span className="font-semibold text-text">{name}</span>
        <span>{VERSION_MARKER}</span>
      </div>
    );
  }

  const logoEl = logo.dataUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo.dataUrl}
      alt="Facility logo"
      className="h-16 w-auto object-contain"
      style={{
        filter: `brightness(${logo.brightness}) contrast(${logo.contrast}) saturate(${logo.saturation})`,
      }}
    />
  ) : (
    <div className="flex h-16 w-32 items-center justify-center rounded border border-dashed border-border text-[10px] text-muted">
      Logo
    </div>
  );

  if (headerLayout.arrangement === "logo-only") {
    return (
      <div className="flex justify-center border-b border-text/20 pb-3">
        {logoEl}
      </div>
    );
  }

  if (headerLayout.arrangement === "logo-centered-stacked") {
    return (
      <div className="flex flex-col items-center gap-1 border-b border-text/20 pb-3 text-center">
        {logoEl}
        <p className="text-sm font-semibold text-brand-dark">{name}</p>
        {facilityInfo.tagline && (
          <p className="text-xs text-muted">{facilityInfo.tagline}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b border-text/20 pb-3">
      {logoEl}
      <div className="text-right">
        <p className="text-sm font-semibold text-brand-dark">{name}</p>
        {facilityInfo.tagline && (
          <p className="text-xs text-muted">{facilityInfo.tagline}</p>
        )}
        {facilityInfo.phone && (
          <p className="text-xs text-muted">{facilityInfo.phone}</p>
        )}
      </div>
    </div>
  );
}
