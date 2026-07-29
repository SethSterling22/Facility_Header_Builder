import type { BookmarkName } from "./bookmarks";

/** Realistic sample patient data used only for the live preview — never written to the generated file. */
export const SAMPLE_PATIENT_DATA: Record<BookmarkName, string> = {
  PatientName: "DOE, JOHN",
  PatientID: "N0000053",
  PatientDOB: "01/23/1968",
  PatientSex: "Male",
  ExamDate: "04/23/2026 10:07 AM",
  ExamDesc: "MRI OF THE CERVICAL SPINE",
  Accession: "12345467",
  RefPhysicianName: "Sarah Klein, MD",
  Body: "FINDINGS: The vertebral bodies are normal in height and alignment...",
};

export const SAMPLE_FACILITY_ADDRESS_LINE =
  "228 Park Ave S #47773, New York, NY 10003";
export const SAMPLE_FACILITY_PHONE_LINE =
  "Office: 415-900-2000 · Fax: 415-301-6739";
