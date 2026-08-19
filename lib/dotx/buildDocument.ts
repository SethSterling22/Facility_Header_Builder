import {
  AlignmentType,
  BorderStyle,
  Bookmark,
  Document,
  Footer,
  Header,
  ImageRun,
  Paragraph,
  PageNumber,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
  type FileChild,
  type IRunOptions,
} from "docx";
import type {
  ExpertRadiologyConfig,
  FacilityInfo,
  HeaderLayout,
  Location,
} from "@/lib/store/wizardStore";
import { computeVisibleRows, type TableRow as VisibleRow } from "./tableLayout";
import {
  getBookmarkDefinition,
  DOC_FONT,
  DOC_FONT_HALF_POINTS,
  EXPERT_RADIOLOGY_INFO,
  TABLE_COLUMN_WIDTHS,
  TABLE_TOTAL_WIDTH,
  VERSION_MARKER,
  type TableBookmarkName,
} from "./bookmarks";
import { fitDimensions, type BakedImage } from "./bakeLogo";
import {
  PAGE_HEIGHT_TWIPS,
  PAGE_MARGIN_TWIPS,
  PAGE_WIDTH_TWIPS,
} from "./pageGeometry";

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "auto" };
/** Every bordered info block gets the same weight line above and below it. */
const INFO_BORDER = {
  style: BorderStyle.SINGLE,
  size: 12,
  color: "auto",
  space: 1,
};
const COLUMN_DIVIDER_BORDER = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: "D9D9D9",
};

const FOOTER_TEXT_HALF_POINTS = 16; // 8pt
const EXPERT_TEXT_HALF_POINTS = 14; // 7pt

export type DotxWizardData = {
  facilityInfo: FacilityInfo;
  locations: Location[];
  headerLayout: HeaderLayout;
  bookmarkConfig: { included: TableBookmarkName[]; includeAddendum: boolean };
  expertRadiology: ExpertRadiologyConfig;
};

/**
 * Every run carries an explicit Arial face. Relying on the theme's minor font
 * lets Word/RamSoft/LibreOffice fall back to a serif when the theme isn't
 * resolved the way we expect.
 */
function run(text: string, options: Omit<IRunOptions, "text"> = {}): TextRun {
  return new TextRun({
    text,
    font: DOC_FONT,
    size: DOC_FONT_HALF_POINTS,
    ...options,
  });
}

function buildLogoImageRun(baked: BakedImage | null): ImageRun | null {
  if (!baked) return null;
  const { width, height } = fitDimensions(baked, { width: 260, height: 96 });
  return new ImageRun({
    type: "png",
    data: baked.dataUrl,
    transformation: { width, height },
  });
}

/**
 * The facility's address/phone/fax as ONE paragraph with line breaks, so a
 * single `pBdr` puts exactly one line above the first line and one below the
 * last — rather than a border per paragraph.
 */
function buildContactBlockParagraph(
  facilityInfo: FacilityInfo,
  locations: Location[],
  size: number,
): Paragraph | null {
  const lines: string[] = [];

  for (const loc of locations) {
    const label = loc.name ? `${loc.name.toUpperCase()} — ` : "";
    if (loc.address) lines.push(`${label}${loc.address}`);
    else if (loc.name) lines.push(loc.name.toUpperCase());

    const contact = [
      loc.phone && `Phone ${loc.phone}`,
      loc.fax && `Fax ${loc.fax}`,
    ]
      .filter(Boolean)
      .join("   ");
    if (contact) lines.push(contact);
  }

  if (locations.length === 0) {
    const contact = [
      facilityInfo.phone && `Phone ${facilityInfo.phone}`,
      facilityInfo.fax && `Fax ${facilityInfo.fax}`,
    ]
      .filter(Boolean)
      .join("   ");
    if (contact) lines.push(contact);
  }

  if (facilityInfo.website) lines.push(facilityInfo.website);

  if (lines.length === 0) return null;

  return new Paragraph({
    alignment: AlignmentType.CENTER,
    border: { top: INFO_BORDER, bottom: INFO_BORDER },
    spacing: { before: 40, after: 40 },
    children: lines.map((line, index) =>
      run(line, { size, break: index === 0 ? undefined : 1 }),
    ),
  });
}

function buildExpertRadiologyParagraph(): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 40, after: 0 },
    children: [
      run(EXPERT_RADIOLOGY_INFO.addressLine, {
        size: EXPERT_TEXT_HALF_POINTS,
      }),
      run(EXPERT_RADIOLOGY_INFO.contactLine, {
        size: EXPERT_TEXT_HALF_POINTS,
        break: 1,
      }),
    ],
  });
}

/**
 * Small spacer so the header never visually crowds the patient-data table.
 * Carries its size on the paragraph mark only — an empty `<w:t></w:t>` run is
 * pointless content that Word itself never writes.
 */
function buildSpacerParagraph(): Paragraph {
  return new Paragraph({
    spacing: { after: 0 },
    run: { font: DOC_FONT, size: 12 },
    children: [],
  });
}

function buildHeaderContent(
  data: DotxWizardData,
  logoRun: ImageRun | null,
  variant: "first" | "default",
): (Paragraph | Table)[] {
  const { facilityInfo, headerLayout, expertRadiology } = data;
  const isCondensed = variant === "default" && headerLayout.pageOneDifferent;

  if (isCondensed) {
    return [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [run(facilityInfo.name || "Facility", { bold: true })],
      }),
      buildSpacerParagraph(),
    ];
  }

  const content: (Paragraph | Table)[] = [];
  const isSideBySide = headerLayout.arrangement === "logo-left-name-right";

  const logoParagraph = new Paragraph({
    alignment: isSideBySide ? AlignmentType.LEFT : AlignmentType.CENTER,
    spacing: { after: 0 },
    children: logoRun ? [logoRun] : [],
  });

  const nameParagraph = new Paragraph({
    alignment: isSideBySide ? AlignmentType.RIGHT : AlignmentType.CENTER,
    spacing: { after: 0 },
    children: [run(facilityInfo.name || "Facility Name", { bold: true })],
  });

  const expertBesideLogo =
    expertRadiology.include && expertRadiology.placement === "beside-logo";

  if (isSideBySide || expertBesideLogo) {
    // A borderless table keeps side-by-side content as normal inline flow —
    // never absolute/anchored positioning, which is what causes the header to
    // overlap the body on later pages.
    const cells: TableCell[] = [];
    const columnWidths: number[] = [];

    const addCell = (width: number, children: Paragraph[]) => {
      columnWidths.push(width);
      cells.push(
        new TableCell({
          width: { size: width, type: WidthType.DXA },
          verticalAlign: VerticalAlign.CENTER,
          borders: {
            top: NO_BORDER,
            bottom: NO_BORDER,
            left: NO_BORDER,
            right: NO_BORDER,
          },
          children,
        }),
      );
    };

    if (expertBesideLogo) {
      addCell(Math.round(TABLE_TOTAL_WIDTH / 2), [logoParagraph]);
      addCell(Math.round(TABLE_TOTAL_WIDTH / 2), [
        buildExpertRadiologyParagraph(),
      ]);
    } else {
      addCell(Math.round(TABLE_TOTAL_WIDTH * 0.4), [logoParagraph]);
      addCell(Math.round(TABLE_TOTAL_WIDTH * 0.6), [nameParagraph]);
    }

    content.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths,
        borders: {
          top: NO_BORDER,
          bottom: NO_BORDER,
          left: NO_BORDER,
          right: NO_BORDER,
          insideHorizontal: NO_BORDER,
          insideVertical: NO_BORDER,
        },
        rows: [new TableRow({ children: cells })],
      }),
    );
  } else {
    content.push(logoParagraph);
    if (headerLayout.arrangement === "logo-centered-stacked") {
      content.push(nameParagraph);
    }
  }

  if (headerLayout.contactPlacement === "header") {
    const contact = buildContactBlockParagraph(
      facilityInfo,
      data.locations,
      DOC_FONT_HALF_POINTS,
    );
    if (contact) content.push(contact);
  }

  if (expertRadiology.include && expertRadiology.placement === "header") {
    content.push(buildExpertRadiologyParagraph());
  }

  content.push(buildSpacerParagraph());
  return content;
}

function buildFooterContent(data: DotxWizardData): (Paragraph | Table)[] {
  const { facilityInfo, locations, headerLayout, expertRadiology } = data;
  const content: (Paragraph | Table)[] = [];

  if (headerLayout.contactPlacement === "footer") {
    if (locations.length > 1) {
      // Several locations read better side by side than stacked.
      const colWidth = Math.floor(TABLE_TOTAL_WIDTH / locations.length);
      content.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          columnWidths: locations.map(() => colWidth),
          alignment: AlignmentType.CENTER,
          borders: {
            top: INFO_BORDER,
            bottom: INFO_BORDER,
            left: NO_BORDER,
            right: NO_BORDER,
            insideHorizontal: NO_BORDER,
            insideVertical: NO_BORDER,
          },
          rows: [
            new TableRow({
              children: locations.map((loc, index) => {
                const lines: string[] = [];
                if (loc.name) lines.push(loc.name.toUpperCase());
                if (loc.address) lines.push(loc.address);
                const contact = [
                  loc.phone && `Phone ${loc.phone}`,
                  loc.fax && `Fax ${loc.fax}`,
                ]
                  .filter(Boolean)
                  .join("   ");
                if (contact) lines.push(contact);

                return new TableCell({
                  width: { size: colWidth, type: WidthType.DXA },
                  verticalAlign: VerticalAlign.CENTER,
                  // Cell borders override the table's in OOXML, so the
                  // top/bottom rules have to be repeated here or the block
                  // loses its line above and below.
                  borders: {
                    top: INFO_BORDER,
                    bottom: INFO_BORDER,
                    left: NO_BORDER,
                    right:
                      index < locations.length - 1
                        ? COLUMN_DIVIDER_BORDER
                        : NO_BORDER,
                  },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { after: 0 },
                      children: lines.map((line, lineIndex) =>
                        run(line, {
                          size: FOOTER_TEXT_HALF_POINTS,
                          bold: lineIndex === 0,
                          break: lineIndex === 0 ? undefined : 1,
                        }),
                      ),
                    }),
                  ],
                });
              }),
            }),
          ],
        }),
      );
    } else {
      const contact = buildContactBlockParagraph(
        facilityInfo,
        locations,
        FOOTER_TEXT_HALF_POINTS,
      );
      if (contact) content.push(contact);
    }
  }

  if (facilityInfo.tagline) {
    content.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 0 },
        children: [
          run(facilityInfo.tagline, {
            bold: true,
            italics: true,
            size: FOOTER_TEXT_HALF_POINTS,
          }),
        ],
      }),
    );
  }

  if (expertRadiology.include && expertRadiology.placement === "footer") {
    content.push(buildExpertRadiologyParagraph());
  }

  content.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 40 },
      children: [
        run("Page ", { size: EXPERT_TEXT_HALF_POINTS }),
        new TextRun({
          children: [PageNumber.CURRENT],
          font: DOC_FONT,
          size: EXPERT_TEXT_HALF_POINTS,
        }),
        run(" of ", { size: EXPERT_TEXT_HALF_POINTS }),
        new TextRun({
          children: [PageNumber.TOTAL_PAGES],
          font: DOC_FONT,
          size: EXPERT_TEXT_HALF_POINTS,
        }),
      ],
    }),
  );

  return content;
}

function buildPatientTable(included: TableBookmarkName[]): Table {
  const rows: VisibleRow[] = computeVisibleRows(included);
  const { label1, value1, label2, value2 } = TABLE_COLUMN_WIDTHS;

  const buildLabelCell = (name: TableBookmarkName | null, width: number) =>
    new TableCell({
      width: { size: width, type: WidthType.DXA },
      children: [
        new Paragraph({
          spacing: { after: 0 },
          // Labels are bold; the bookmark/value cells stay regular weight.
          children: name
            ? [run(getBookmarkDefinition(name).label, { bold: true })]
            : [],
        }),
      ],
    });

  const buildValueCell = (name: TableBookmarkName | null, width: number) =>
    new TableCell({
      width: { size: width, type: WidthType.DXA },
      children: [
        new Paragraph({
          spacing: { after: 0 },
          children: name ? [new Bookmark({ id: name, children: [] })] : [],
        }),
      ],
    });

  return new Table({
    width: { size: TABLE_TOTAL_WIDTH, type: WidthType.DXA },
    columnWidths: [label1, value1, label2, value2],
    borders: {
      // Rule: a line above AND below the block, not just below.
      top: INFO_BORDER,
      bottom: INFO_BORDER,
      left: NO_BORDER,
      right: NO_BORDER,
      insideVertical: NO_BORDER,
      insideHorizontal: NO_BORDER,
    },
    rows: rows.map(
      (row) =>
        new TableRow({
          children: [
            buildLabelCell(row.left, label1),
            buildValueCell(row.left, value1),
            buildLabelCell(row.right, label2),
            buildValueCell(row.right, value2),
          ],
        }),
    ),
  });
}

export function buildDocument(
  data: DotxWizardData,
  bakedLogo: BakedImage | null,
): Document {
  const bodyChildren: FileChild[] = [
    buildPatientTable(data.bookmarkConfig.included),
  ];

  // RamSoft renders whichever paragraph comes first in document.xml first, so
  // Addendum must precede Body for addenda to appear at the top of the report.
  if (data.bookmarkConfig.includeAddendum) {
    bodyChildren.push(
      new Paragraph({ children: [new Bookmark({ id: "Addendum", children: [] })] }),
    );
  }

  bodyChildren.push(
    new Paragraph({ children: [new Bookmark({ id: "Body", children: [] })] }),
    new Paragraph({ children: [run(VERSION_MARKER)] }),
  );

  const pageOneDifferent = data.headerLayout.pageOneDifferent;
  const makeHeader = (variant: "first" | "default") =>
    new Header({
      // A fresh ImageRun per header part: the same instance can't be shared
      // across parts, since each part owns its own image relationship.
      children: buildHeaderContent(data, buildLogoImageRun(bakedLogo), variant),
    });

  return new Document({
    styles: {
      // Anything without an explicit override still resolves to Arial 12
      // instead of silently falling back to the theme's font.
      default: {
        document: {
          run: { font: DOC_FONT, size: DOC_FONT_HALF_POINTS },
        },
      },
    },
    sections: [
      {
        properties: {
          titlePage: pageOneDifferent,
          page: {
            // Explicit US Letter — the default is A4, which is narrower than
            // the patient-data table and pushes it off the page.
            size: { width: PAGE_WIDTH_TWIPS, height: PAGE_HEIGHT_TWIPS },
            margin: {
              top: PAGE_MARGIN_TWIPS,
              right: PAGE_MARGIN_TWIPS,
              bottom: PAGE_MARGIN_TWIPS,
              left: PAGE_MARGIN_TWIPS,
            },
          },
        },
        headers: {
          default: makeHeader("default"),
          ...(pageOneDifferent ? { first: makeHeader("first") } : {}),
        },
        footers: {
          default: new Footer({ children: buildFooterContent(data) }),
          ...(pageOneDifferent
            ? { first: new Footer({ children: buildFooterContent(data) }) }
            : {}),
        },
        children: bodyChildren,
      },
    ],
  });
}
