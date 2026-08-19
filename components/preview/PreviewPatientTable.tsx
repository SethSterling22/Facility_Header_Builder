"use client";

import { useWizardStore } from "@/lib/store/wizardStore";
import { computeVisibleRows } from "@/lib/dotx/tableLayout";
import {
  getBookmarkDefinition,
  type TableBookmarkName,
} from "@/lib/dotx/bookmarks";
import { SAMPLE_PATIENT_DATA, SAMPLE_BODY_TEXT } from "@/lib/dotx/sampleData";
import {
  BODY_FONT_PX,
  COLUMN_PERCENTS,
  INFO_BORDER_CSS,
} from "@/lib/dotx/pageGeometry";

function Cell({
  bookmark,
  isValue,
  widthPercent,
}: {
  bookmark: TableBookmarkName | null;
  isValue?: boolean;
  widthPercent: number;
}) {
  return (
    <td
      style={{
        width: `${widthPercent}%`,
        verticalAlign: "top",
        padding: "2px 4px 2px 0",
        fontWeight: isValue ? 400 : 700,
      }}
    >
      {bookmark
        ? isValue
          ? SAMPLE_PATIENT_DATA[bookmark]
          : getBookmarkDefinition(bookmark).label
        : ""}
    </td>
  );
}

export function PreviewPatientTable() {
  const included = useWizardStore((s) => s.bookmarkConfig.included);
  const includeAddendum = useWizardStore(
    (s) => s.bookmarkConfig.includeAddendum,
  );
  const rows = computeVisibleRows(included);

  return (
    <div style={{ fontSize: BODY_FONT_PX }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          borderTop: INFO_BORDER_CSS,
          borderBottom: INFO_BORDER_CSS,
        }}
      >
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <Cell bookmark={row.left} widthPercent={COLUMN_PERCENTS.label1} />
              <Cell bookmark={row.left} isValue widthPercent={COLUMN_PERCENTS.value1} />
              <Cell bookmark={row.right} widthPercent={COLUMN_PERCENTS.label2} />
              <Cell bookmark={row.right} isValue widthPercent={COLUMN_PERCENTS.value2} />
            </tr>
          ))}
        </tbody>
      </table>

      {includeAddendum && (
        <p style={{ marginTop: 10, fontStyle: "italic", opacity: 0.5 }}>
          [Addendum renders here, above the report body]
        </p>
      )}
      <p style={{ marginTop: 10, lineHeight: 1.4 }}>{SAMPLE_BODY_TEXT}</p>
    </div>
  );
}
