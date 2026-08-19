"use client";

import { EXPERT_RADIOLOGY_INFO } from "@/lib/dotx/bookmarks";
import {
  EXPERT_RADIOLOGY_LOGO_DATA_URL,
  EXPERT_RADIOLOGY_LOGO_RENDER_PX,
} from "@/lib/dotx/expertRadiologyLogo";
import { EXPERT_FONT_PX } from "@/lib/dotx/pageGeometry";

export function PreviewExpertRadiology() {
  return (
    <div
      style={{ fontSize: EXPERT_FONT_PX, textAlign: "center", lineHeight: 1.35 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={EXPERT_RADIOLOGY_LOGO_DATA_URL}
        alt="Expert Radiology"
        width={EXPERT_RADIOLOGY_LOGO_RENDER_PX.width}
        height={EXPERT_RADIOLOGY_LOGO_RENDER_PX.height}
        style={{ display: "inline-block", marginBottom: 2 }}
      />
      <div>{EXPERT_RADIOLOGY_INFO.addressLine}</div>
      <div>{EXPERT_RADIOLOGY_INFO.contactLine}</div>
    </div>
  );
}
