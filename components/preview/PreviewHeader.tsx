"use client";

import { useWizardStore } from "@/lib/store/wizardStore";
import { BODY_FONT_PX, FOOTER_FONT_PX } from "@/lib/dotx/pageGeometry";
import { buildContactLines } from "@/lib/dotx/buildDocument";
import { PreviewContactBlock } from "./PreviewContactBlock";
import { PreviewExpertRadiology } from "./PreviewExpertRadiology";

export function PreviewHeader({ variant }: { variant: "first" | "default" }) {
  const facilityInfo = useWizardStore((s) => s.facilityInfo);
  const logo = useWizardStore((s) => s.logo);
  const headerLayout = useWizardStore((s) => s.headerLayout);
  const expertRadiology = useWizardStore((s) => s.expertRadiology);
  const locations = useWizardStore((s) => s.locations);

  const isCondensed = variant === "default" && headerLayout.pageOneDifferent;
  const name = facilityInfo.name || "Your Facility Name";

  if (isCondensed) {
    return (
      <div style={{ fontSize: BODY_FONT_PX, fontWeight: 700 }}>{name}</div>
    );
  }

  const isNameBeside = headerLayout.arrangement === "logo-left-name-right";
  const isAddressBeside =
    headerLayout.arrangement === "logo-left-address-right";
  const isSideBySide = isNameBeside || isAddressBeside;
  const expertBesideLogo =
    expertRadiology.include && expertRadiology.placement === "beside-logo";

  // Same width the document prints at, so the preview shows the real scale.
  const logoWidthPx = logo.widthInches * 96;

  const logoEl = logo.dataUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo.dataUrl}
      alt="Facility logo"
      style={{
        width: logoWidthPx,
        maxWidth: "100%",
        height: "auto",
        filter: `brightness(${logo.brightness}) contrast(${logo.contrast}) saturate(${logo.saturation})`,
      }}
    />
  ) : (
    <div
      style={{
        height: Math.round(logoWidthPx * 0.35),
        width: logoWidthPx,
        maxWidth: "100%",
        border: "1px dashed #bbb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        color: "#999",
      }}
    >
      Logo
    </div>
  );

  const addressLines = buildContactLines(facilityInfo, locations);

  const nameEl = (
    <div style={{ fontSize: BODY_FONT_PX, fontWeight: 700 }}>{name}</div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {expertBesideLogo ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ flex: 1 }}>{logoEl}</div>
          <div style={{ flex: 1 }}>
            <PreviewExpertRadiology />
          </div>
        </div>
      ) : isSideBySide ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          {/* 3000/7800 twips, matching the generated header table. */}
          <div style={{ flex: isAddressBeside ? "0 0 27.8%" : "0 0 40%" }}>
            {logoEl}
          </div>
          <div
            style={{
              flex: isAddressBeside ? "0 0 72.2%" : "0 0 60%",
              textAlign: "right",
            }}
          >
            {isAddressBeside ? (
              <div style={{ fontSize: FOOTER_FONT_PX, lineHeight: 1.35 }}>
                {addressLines.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            ) : (
              nameEl
            )}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            {logoEl}
          </div>
          {headerLayout.arrangement === "logo-centered-stacked" && nameEl}
        </div>
      )}

      {headerLayout.contactPlacement === "header" && (
        <PreviewContactBlock fontPx={BODY_FONT_PX} />
      )}
      {expertRadiology.include && expertRadiology.placement === "header" && (
        <PreviewExpertRadiology />
      )}
    </div>
  );
}
