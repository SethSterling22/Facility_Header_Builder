export type BookmarkCategory =
  | "Patient Identification"
  | "Study & Exam Details"
  | "Physician & Report";

/** The 8 bookmarks that live as label/value pairs in the patient-data table. */
export type TableBookmarkName =
  | "PatientName"
  | "PatientID"
  | "PatientDOB"
  | "PatientSex"
  | "ExamDate"
  | "ExamDesc"
  | "Accession"
  | "RefPhysicianName";

/** Body-level bookmarks: `Body` is always present, `Addendum` is optional. */
export type BodyBookmarkName = "Body" | "Addendum";

export type BookmarkName = TableBookmarkName | BodyBookmarkName;

export type BookmarkDefinition = {
  /** Fixed RamSoft bookmark name — never rename or invent new ones. */
  name: TableBookmarkName;
  /** Visible label printed next to the bookmark cell in the report. */
  label: string;
  category: BookmarkCategory;
};

export const BOOKMARK_DEFINITIONS: readonly BookmarkDefinition[] = [
  { name: "PatientName", label: "Patient Name:", category: "Patient Identification" },
  { name: "PatientID", label: "Patient ID:", category: "Patient Identification" },
  { name: "PatientDOB", label: "Date of Birth:", category: "Patient Identification" },
  { name: "PatientSex", label: "Gender:", category: "Patient Identification" },
  { name: "ExamDate", label: "Exam Date:", category: "Study & Exam Details" },
  { name: "ExamDesc", label: "Exam Description:", category: "Study & Exam Details" },
  { name: "Accession", label: "Accession:", category: "Study & Exam Details" },
  { name: "RefPhysicianName", label: "Referring Physician:", category: "Physician & Report" },
];

export const BOOKMARK_CATEGORIES: readonly BookmarkCategory[] = [
  "Patient Identification",
  "Study & Exam Details",
  "Physician & Report",
];

/** The 4-row/2-column pairing from the reference RamSoft block. Structure is fixed. */
export const DEFAULT_TABLE_ROWS: readonly [TableBookmarkName, TableBookmarkName][] = [
  ["PatientName", "ExamDate"],
  ["PatientID", "ExamDesc"],
  ["PatientDOB", "Accession"],
  ["PatientSex", "RefPhysicianName"],
];

export const DEFAULT_BOOKMARK_ORDER: readonly TableBookmarkName[] =
  BOOKMARK_DEFINITIONS.map((b) => b.name);

/** Fixed brand version marker — never editable, never incremented. */
export const VERSION_MARKER = "V3";

/**
 * Company font standard for the patient-data block: Arial 12pt, labels bold.
 * Sizes are in half-points, which is what OOXML's `w:sz` expects.
 */
export const DOC_FONT = "Arial";
export const DOC_FONT_HALF_POINTS = 24; // 12pt

/**
 * Column widths in twips. Arial 12 **bold** labels are wider than the reference
 * block's original theme font, so the default 1800/2520/2430/3600 widths make
 * "Patient Name:" and "Referring Physician:" wrap onto two lines. These are the
 * widened values confirmed on real builds (label columns >= 2200 / >= 3000).
 */
export const TABLE_COLUMN_WIDTHS = {
  label1: 2200,
  value1: 2260,
  label2: 3000,
  value2: 3340,
} as const;

export const TABLE_TOTAL_WIDTH =
  TABLE_COLUMN_WIDTHS.label1 +
  TABLE_COLUMN_WIDTHS.value1 +
  TABLE_COLUMN_WIDTHS.label2 +
  TABLE_COLUMN_WIDTHS.value2;

/** Expert Radiology's own contact block — only used when explicitly opted in. */
export const EXPERT_RADIOLOGY_INFO = {
  addressLine: "METRO OFFICE PARK, BLDG 7, STE 203, Guaynabo, PR 00968",
  // No "+1" on the phone and no "https://" on the site — company formatting rule.
  contactLine: "415-900-2000  |  www.expertradiology.com",
} as const;

export function getBookmarkDefinition(
  name: TableBookmarkName,
): BookmarkDefinition {
  const def = BOOKMARK_DEFINITIONS.find((b) => b.name === name);
  if (!def) {
    throw new Error(`Unknown bookmark name: ${name}`);
  }
  return def;
}
