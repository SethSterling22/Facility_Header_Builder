"use client";

import { useWizardStore } from "@/lib/store/wizardStore";
import { BODY_FONT_PX } from "@/lib/dotx/pageGeometry";
import { PreviewContactBlock } from "./PreviewContactBlock";
import { PreviewExpertRadiology } from "./PreviewExpertRadiology";

export function PreviewHeader({ variant }: { variant: "first" | "default" }) {
  const facilityInfo = useWizardStore((s) => s.facilityInfo);
  const logo = useWizardStore((s) => s.logo);
  const headerLayout = useWizardStore((s) => s.headerLayout);
  const expertRadiology = useWizardStore((s) => s.expertRadiology);

  const isCondensed = variant === "default" && headerLayout.pageOneDifferent;
  const name = facilityInfo.name || "Your Facility Name";

  if (isCondensed) {
    return (
      <div style={{ fontSize: BODY_FONT_PX, fontWeight: 700 }}>{name}</div>
    );
  }

  const isSideBySide = headerLayout.arrangement === "logo-left-name-right";
  const expertBesideLogo =
    expertRadiology.include && expertRadiology.placement === "beside-logo";

  const logoEl = logo.dataUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo.dataUrl}
      alt="Facility logo"
      style={{
        maxHeight: 72,
        maxWidth: "100%",
        objectFit: "contain",
        filter: `brightness(${logo.brightness}) contrast(${logo.contrast}) saturate(${logo.saturation})`,
      }}
    />
  ) : (
    <div
      style={{
        height: 72,
        width: 160,
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
          <div style={{ flex: "0 0 40%" }}>{logoEl}</div>
          <div style={{ flex: "0 0 60%", textAlign: "right" }}>{nameEl}</div>
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
