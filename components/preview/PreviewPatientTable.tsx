"use client";

import clsx from "clsx";
import { useWizardStore } from "@/lib/store/wizardStore";
import { computeVisibleRows } from "@/lib/dotx/tableLayout";
import { getBookmarkDefinition, type BookmarkName } from "@/lib/dotx/bookmarks";
import { SAMPLE_PATIENT_DATA } from "@/lib/dotx/sampleData";

function Cell({
  bookmark,
  value,
  width,
}: {
  bookmark: BookmarkName | null;
  value?: boolean;
  width: string;
}) {
  if (!bookmark) {
    return <td style={{ width }} className="px-1 py-1.5" />;
  }
  const def = getBookmarkDefinition(bookmark);
  return (
    <td
      style={{ width }}
      className={clsx(
        "px-1 py-1.5 align-top",
        value ? "font-normal text-text" : "font-semibold text-text",
      )}
    >
      {value ? SAMPLE_PATIENT_DATA[bookmark] : def.label}
    </td>
  );
}

export function PreviewPatientTable() {
  const included = useWizardStore((s) => s.bookmarkConfig.included);
  const rows = computeVisibleRows(included);
  const hasBody = included.includes("Body");

  return (
    <div className="border-y border-text/20">
      {rows.length > 0 && (
        <table className="w-full border-collapse text-[11px]">
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-text/10 last:border-b-0">
                <Cell bookmark={row.left} width="18%" />
                <Cell bookmark={row.left} value width="32%" />
                <Cell bookmark={row.right} width="18%" />
                <Cell bookmark={row.right} value width="32%" />
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {hasBody && (
        <p className="px-1 py-2 text-[11px] leading-snug text-text/90">
          {SAMPLE_PATIENT_DATA.Body}
        </p>
      )}
    </div>
  );
}
