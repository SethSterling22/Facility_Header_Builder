import { TABLE_COLUMN_WIDTHS, TABLE_TOTAL_WIDTH } from "./bookmarks";

/**
 * Real page geometry, in CSS pixels at 96dpi, so the live preview can be laid
 * out with the same proportions the generated .dotx uses rather than an
 * eyeballed approximation.
 */
export const PAGE_WIDTH_PX = 816; // 8.5in
export const PAGE_HEIGHT_PX = 1056; // 11in
export const PAGE_MARGIN_PX = 48; // 0.5in, matching the section margins

/** Word sizes are half-points; CSS wants px at 96dpi (pt * 96/72). */
export function halfPointsToPx(halfPoints: number): number {
  return (halfPoints / 2) * (96 / 72);
}

export const BODY_FONT_PX = halfPointsToPx(24); // Arial 12pt
export const FOOTER_FONT_PX = halfPointsToPx(16); // 8pt
export const EXPERT_FONT_PX = halfPointsToPx(14); // 7pt

/** Column widths as percentages of the table, straight from the twip widths. */
export const COLUMN_PERCENTS = {
  label1: (TABLE_COLUMN_WIDTHS.label1 / TABLE_TOTAL_WIDTH) * 100,
  value1: (TABLE_COLUMN_WIDTHS.value1 / TABLE_TOTAL_WIDTH) * 100,
  label2: (TABLE_COLUMN_WIDTHS.label2 / TABLE_TOTAL_WIDTH) * 100,
  value2: (TABLE_COLUMN_WIDTHS.value2 / TABLE_TOTAL_WIDTH) * 100,
} as const;

/** The document is rendered entirely in Arial per the company standard. */
export const DOC_FONT_STACK = "Arial, Helvetica, sans-serif";

/** Matches the OOXML `w:sz="12"` info-block border. */
export const INFO_BORDER_CSS = "1.5px solid #000";
