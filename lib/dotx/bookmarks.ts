export type BookmarkCategory =
  | "Patient Identification"
  | "Study & Exam Details"
  | "Physician & Report";

export type BookmarkName =
  | "PatientName"
  | "PatientID"
  | "PatientDOB"
  | "PatientSex"
  | "ExamDate"
  | "ExamDesc"
  | "Accession"
  | "RefPhysicianName"
  | "Body";

export type BookmarkDefinition = {
  /** Fixed RamSoft bookmark name — never rename or invent new ones. */
  name: BookmarkName;
  /** Visible label printed next to the bookmark cell in the report. */
  label: string;
  category: BookmarkCategory;
  /** Whether this bookmark spans a full row (e.g. Body) rather than a label/value pair. */
  fullWidth?: boolean;
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
  { name: "Body", label: "Report Body", category: "Physician & Report", fullWidth: true },
];

export const BOOKMARK_CATEGORIES: readonly BookmarkCategory[] = [
  "Patient Identification",
  "Study & Exam Details",
  "Physician & Report",
];

/** The default table row pairing, matching the reference RamSoft block layout. */
export const DEFAULT_TABLE_ROWS: readonly [BookmarkName, BookmarkName][] = [
  ["PatientName", "ExamDate"],
  ["PatientID", "ExamDesc"],
  ["PatientDOB", "Accession"],
  ["PatientSex", "RefPhysicianName"],
];

export const DEFAULT_BOOKMARK_ORDER: readonly BookmarkName[] =
  BOOKMARK_DEFINITIONS.map((b) => b.name);

/** Fixed brand version marker — never editable, never incremented. */
export const VERSION_MARKER = "V3";

export function getBookmarkDefinition(name: BookmarkName): BookmarkDefinition {
  const def = BOOKMARK_DEFINITIONS.find((b) => b.name === name);
  if (!def) {
    throw new Error(`Unknown bookmark name: ${name}`);
  }
  return def;
}
