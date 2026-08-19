"use client";

import { useWizardStore } from "@/lib/store/wizardStore";
import { INFO_BORDER_CSS } from "@/lib/dotx/pageGeometry";

/**
 * The facility's address/phone/fax. Mirrors the generated document: one block
 * with a single line above and a single line below, never a border per line.
 */
export function PreviewContactBlock({ fontPx }: { fontPx: number }) {
  const facilityInfo = useWizardStore((s) => s.facilityInfo);
  const locations = useWizardStore((s) => s.locations);

  const lines: string[] = [];

  for (const loc of locations) {
    const label = loc.name ? `${loc.name.toUpperCase()} — ` : "";
    if (loc.address) lines.push(`${label}${loc.address}`);
    else if (loc.name) lines.push(loc.name.toUpperCase());

    const contact = [
      loc.phone && `Phone ${loc.phone}`,
      loc.fax && `Fax ${loc.fax}`,
    ]
      .filter(Boolean)
      .join("   ");
    if (contact) lines.push(contact);
  }

  if (locations.length === 0) {
    const contact = [
      facilityInfo.phone && `Phone ${facilityInfo.phone}`,
      facilityInfo.fax && `Fax ${facilityInfo.fax}`,
    ]
      .filter(Boolean)
      .join("   ");
    if (contact) lines.push(contact);
  }

  if (facilityInfo.website) lines.push(facilityInfo.website);

  if (lines.length === 0) return null;

  return (
    <div
      style={{
        borderTop: INFO_BORDER_CSS,
        borderBottom: INFO_BORDER_CSS,
        fontSize: fontPx,
        padding: "2px 0",
        textAlign: "center",
        lineHeight: 1.35,
      }}
    >
      {lines.map((line) => (
        <div key={line}>{line}</div>
      ))}
    </div>
  );
}
