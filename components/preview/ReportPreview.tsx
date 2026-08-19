"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useWizardStore } from "@/lib/store/wizardStore";
import {
  DOC_FONT_STACK,
  PAGE_HEIGHT_PX,
  PAGE_MARGIN_PX,
  PAGE_WIDTH_PX,
} from "@/lib/dotx/pageGeometry";
import { PreviewHeader } from "./PreviewHeader";
import { PreviewPatientTable } from "./PreviewPatientTable";
import { PreviewFooter } from "./PreviewFooter";

const PAGES = ["first", "default"] as const;

/**
 * Renders the page at true Letter dimensions and scales the whole thing down to
 * fit, so every element keeps its real proportion to the page instead of the
 * text being sized independently of the paper.
 */
function useFitScale() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      if (width > 0) setScale(Math.min(width / PAGE_WIDTH_PX, 1));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { containerRef, scale };
}

export function ReportPreview() {
  const pageOneDifferent = useWizardStore(
    (s) => s.headerLayout.pageOneDifferent,
  );
  const [page, setPage] = useState<"first" | "default">("first");
  const { containerRef, scale } = useFitScale();

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

      <div ref={containerRef} className="w-full overflow-hidden">
        {/* transform: scale() doesn't shrink layout size, so the wrapper has to
            carry the scaled dimensions or the 816px page widens its column. */}
        <div
          style={{
            width: PAGE_WIDTH_PX * scale,
            height: PAGE_HEIGHT_PX * scale,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: PAGE_WIDTH_PX,
              height: PAGE_HEIGHT_PX,
              padding: PAGE_MARGIN_PX,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              background: "#fff",
              color: "#000",
              fontFamily: DOC_FONT_STACK,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            }}
          >
            <PreviewHeader variant={page} />
            <PreviewPatientTable />
            <PreviewFooter
              pageLabel={page === "first" ? "Page 1 of 2" : "Page 2 of 2"}
            />
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-muted">
        Rendered at true Letter proportions in Arial 12 — the downloaded .dotx
        is still the authoritative result.
      </p>
    </div>
  );
}
