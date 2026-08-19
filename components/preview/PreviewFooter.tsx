"use client";

import { useWizardStore } from "@/lib/store/wizardStore";
import {
  EXPERT_FONT_PX,
  FOOTER_FONT_PX,
  INFO_BORDER_CSS,
} from "@/lib/dotx/pageGeometry";
import { PreviewContactBlock } from "./PreviewContactBlock";
import { PreviewExpertRadiology } from "./PreviewExpertRadiology";

export function PreviewFooter({ pageLabel }: { pageLabel: string }) {
  const locations = useWizardStore((s) => s.locations);
  const facilityInfo = useWizardStore((s) => s.facilityInfo);
  const headerLayout = useWizardStore((s) => s.headerLayout);
  const expertRadiology = useWizardStore((s) => s.expertRadiology);

  const contactInFooter = headerLayout.contactPlacement === "footer";
  const multiLocation = contactInFooter && locations.length > 1;

  return (
    <div style={{ marginTop: "auto", display: "grid", gap: 4 }}>
      {multiLocation ? (
        <div
          style={{
            display: "flex",
            borderTop: INFO_BORDER_CSS,
            borderBottom: INFO_BORDER_CSS,
            fontSize: FOOTER_FONT_PX,
            padding: "3px 0",
          }}
        >
          {locations.map((loc, index) => (
            <div
              key={loc.id}
              style={{
                flex: 1,
                textAlign: "center",
                lineHeight: 1.35,
                borderRight:
                  index < locations.length - 1 ? "1px solid #d9d9d9" : undefined,
              }}
            >
              {loc.name && <div style={{ fontWeight: 700 }}>{loc.name.toUpperCase()}</div>}
              {loc.address && <div>{loc.address}</div>}
              {(loc.phone || loc.fax) && (
                <div>
                  {[
                    loc.phone && `Phone ${loc.phone}`,
                    loc.fax && `Fax ${loc.fax}`,
                  ]
                    .filter(Boolean)
                    .join("   ")}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        contactInFooter && <PreviewContactBlock fontPx={FOOTER_FONT_PX} />
      )}

      {facilityInfo.tagline && (
        <div
          style={{
            fontSize: FOOTER_FONT_PX,
            fontWeight: 700,
            fontStyle: "italic",
            textAlign: "center",
          }}
        >
          {facilityInfo.tagline}
        </div>
      )}

      {expertRadiology.include && expertRadiology.placement === "footer" && (
        <PreviewExpertRadiology />
      )}

      <div style={{ fontSize: EXPERT_FONT_PX, textAlign: "right" }}>
        {pageLabel}
      </div>
    </div>
  );
}
