"use client";

import { useState } from "react";
import clsx from "clsx";
import { useWizardStore } from "@/lib/store/wizardStore";
import { PreviewHeader } from "./PreviewHeader";
import { PreviewPatientTable } from "./PreviewPatientTable";
import { PreviewFooter } from "./PreviewFooter";

const PAGES = ["first", "default"] as const;

export function ReportPreview() {
  const pageOneDifferent = useWizardStore(
    (s) => s.headerLayout.pageOneDifferent,
  );
  const [page, setPage] = useState<"first" | "default">("first");

  return (
    <div className="flex flex-col gap-3">
      {pageOneDifferent && (
        <div className="mx-auto flex gap-1 rounded-lg bg-bg p-1">
          {PAGES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={clsx(
                "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                page === p
                  ? "bg-brand-dark text-white"
                  : "text-muted hover:text-text",
              )}
            >
              {p === "first" ? "Page 1" : "Page 2+"}
            </button>
          ))}
        </div>
      )}
      <div
        className="mx-auto flex w-full max-w-[816px] flex-col gap-4 rounded-sm bg-white p-10 shadow-[0_4px_24px_rgba(0,0,0,0.12)]"
        style={{ aspectRatio: "8.5 / 11" }}
      >
        <PreviewHeader variant={page} />
        <PreviewPatientTable />
        <PreviewFooter
          pageLabel={page === "first" ? "Page 1 of 2" : "Page 2 of 2"}
        />
      </div>
      <p className="text-center text-xs text-muted">
        Approximate preview — the downloaded .dotx is the authoritative
        result.
      </p>
    </div>
  );
}
