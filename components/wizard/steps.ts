import type { StepInfo } from "@/components/ui/Stepper";

export const WIZARD_STEPS: StepInfo[] = [
  { id: "entry", label: "Start" },
  { id: "facility", label: "Facility Info" },
  { id: "logo", label: "Logo" },
  { id: "locations", label: "Locations" },
  { id: "layout", label: "Header Layout" },
  { id: "bookmarks", label: "Report Fields" },
  { id: "review", label: "Review & Generate" },
];
