import { DEFAULT_TABLE_ROWS, type TableBookmarkName } from "./bookmarks";

export type TableRow = {
  left: TableBookmarkName | null;
  right: TableBookmarkName | null;
};

/**
 * The 4-row/2-column pairing below is the RamSoft reference block's validated
 * structure (see the header-template skill's assets/ramsoft_bookmark_block.xml)
 * — it stays fixed. Only whether a given bookmark's cell renders is user-controlled;
 * a fully-excluded row is dropped, an excluded cell within a kept row is left blank.
 */
export function computeVisibleRows(
  included: readonly TableBookmarkName[],
): TableRow[] {
  const isIncluded = (name: TableBookmarkName) => included.includes(name);
  return DEFAULT_TABLE_ROWS.map(([left, right]) => ({
    left: isIncluded(left) ? left : null,
    right: isIncluded(right) ? right : null,
  })).filter((row) => row.left || row.right);
}
