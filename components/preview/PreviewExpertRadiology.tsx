"use client";

import { EXPERT_RADIOLOGY_INFO } from "@/lib/dotx/bookmarks";
import { EXPERT_FONT_PX } from "@/lib/dotx/pageGeometry";

export function PreviewExpertRadiology() {
  return (
    <div
      style={{ fontSize: EXPERT_FONT_PX, textAlign: "center", lineHeight: 1.35 }}
    >
      <div>{EXPERT_RADIOLOGY_INFO.addressLine}</div>
      <div>{EXPERT_RADIOLOGY_INFO.contactLine}</div>
    </div>
  );
}
