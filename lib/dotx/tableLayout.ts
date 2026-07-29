import { DEFAULT_TABLE_ROWS, type BookmarkName } from "./bookmarks";

export type TableRow = {
  left: BookmarkName | null;
  right: BookmarkName | null;
};

/**
 * The 4-row/2-column pairing below is the RamSoft reference block's validated
 * structure (see the header-template skill's assets/ramsoft_bookmark_block.xml)
 * — it stays fixed. Only whether a given bookmark's cell renders is user-controlled;
 * a fully-excluded row is dropped, an excluded cell within a kept row is left blank.
 */
export function computeVisibleRows(
  included: readonly BookmarkName[],
): TableRow[] {
  const isIncluded = (name: BookmarkName) => included.includes(name);
  return DEFAULT_TABLE_ROWS.map(([left, right]) => ({
    left: isIncluded(left) ? left : null,
    right: isIncluded(right) ? right : null,
  })).filter((row) => row.left || row.right);
}
