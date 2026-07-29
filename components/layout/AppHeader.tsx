import { FileText } from "lucide-react";

export function AppHeader() {
  return (
    <header className="flex items-center gap-3.5 bg-brand-dark px-8 py-4.5 text-white shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
      <FileText className="h-7 w-7 shrink-0" strokeWidth={1.75} />
      <div>
        <h1 className="text-[1.25rem] font-semibold tracking-[0.3px]">
          Facility Header Builder
        </h1>
        <span className="text-[0.9rem] opacity-70">
          Expert Radiology™ — build and preview your report header
        </span>
      </div>
    </header>
  );
}
