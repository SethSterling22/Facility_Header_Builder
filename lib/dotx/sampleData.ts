import type { TableBookmarkName } from "./bookmarks";

/** Realistic sample patient data used only for the live preview — never written to the generated file. */
export const SAMPLE_PATIENT_DATA: Record<TableBookmarkName, string> = {
  PatientName: "ZABALA RIVERA, HECTOR",
  PatientID: "GR-2026129980",
  PatientDOB: "11/06/1995",
  PatientSex: "M",
  ExamDate: "05/25/2026 01:23:08 PM",
  ExamDesc: "RT-SHOULDER 1 VIEW",
  Accession: "20260525189959",
  RefPhysicianName: "KNAPP JR., AVERY",
};

export const SAMPLE_BODY_TEXT =
  "FINDINGS: The vertebral bodies are normal in height and alignment...";
