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
} from "docx";
import type {
  FacilityInfo,
  HeaderLayout,
  Location,
} from "@/lib/store/wizardStore";
import { computeVisibleRows, type TableRow as VisibleRow } from "./tableLayout";
import {
  getBookmarkDefinition,
  VERSION_MARKER,
  type BookmarkName,
} from "./bookmarks";
import { fitDimensions, type BakedImage } from "./bakeLogo";

const LABEL_COL_TWIPS = 1800;
const VALUE_COL_TWIPS = 2520;
const LABEL2_COL_TWIPS = 2430;
const VALUE2_COL_TWIPS = 3600;

const HEADER_LOGO_CELL_TWIPS = 2600;
const HEADER_NAME_CELL_TWIPS = 6760;

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const ROW_BORDER = { style: BorderStyle.SINGLE, size: 4, color: "999999" };
const DIVIDER_BORDER = { style: BorderStyle.SINGLE, size: 6, color: "1B3A6B", space: 1 };
const COLUMN_DIVIDER_BORDER = { style: BorderStyle.SINGLE, size: 4, color: "D9D9D9" };
const BRAND_NAVY = "1B3A6B";

// Content width for a US Letter page with 1" margins (8.5in - 2in = 6.5in = 9360 twips).
const CONTENT_WIDTH_TWIPS = 9360;

function buildDividerParagraph(): Paragraph {
  return new Paragraph({
    border: { bottom: DIVIDER_BORDER },
    spacing: { after: 40 },
    children: [],
  });
}

export type DotxWizardData = {
  facilityInfo: FacilityInfo;
  locations: Location[];
  headerLayout: HeaderLayout;
  bookmarkConfig: { included: BookmarkName[] };
};

function buildLogoImageRun(baked: BakedImage | null): ImageRun | null {
  if (!baked) return null;
  const { width, height } = fitDimensions(baked, { width: 200, height: 88 });
  return new ImageRun({
    type: "png",
    data: baked.dataUrl,
    transformation: { width, height },
  });
}

function buildHeaderContent(
  facilityInfo: FacilityInfo,
  logoRun: ImageRun | null,
  headerLayout: HeaderLayout,
  variant: "first" | "default",
): (Paragraph | Table)[] {
  const isCondensed = variant === "default" && headerLayout.pageOneDifferent;

  if (isCondensed) {
    return [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({ text: facilityInfo.name || "Facility", bold: true }),
        ],
      }),
      buildDividerParagraph(),
    ];
  }

  // Tagline lives in the footer only (see buildFooterContent) — showing it
  // in both places duplicated it for the logo-left/centered arrangements.
  const nameParagraphs = [
    new Paragraph({
      alignment:
        headerLayout.arrangement === "logo-centered-stacked"
          ? AlignmentType.CENTER
          : AlignmentType.RIGHT,
      children: [
        new TextRun({ text: facilityInfo.name || "Facility Name", bold: true }),
      ],
    }),
  ];

  const logoParagraph = new Paragraph({
    alignment:
      headerLayout.arrangement === "logo-left-address-right"
        ? AlignmentType.LEFT
        : AlignmentType.CENTER,
    children: logoRun ? [logoRun] : [],
  });

  if (headerLayout.arrangement === "logo-only") {
    return [logoParagraph, buildDividerParagraph()];
  }

  if (headerLayout.arrangement === "logo-centered-stacked") {
    return [logoParagraph, ...nameParagraphs, buildDividerParagraph()];
  }

  // logo-left-address-right: a borderless 2-column table keeps the logo and
  // name/tagline as normal inline flowing content side by side — never
  // absolute/anchored positioning (see the header-template skill's overlap rule).
  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      // Without explicit column widths, Word/LibreOffice fall back to a
      // near-zero default grid column — the symptom is header text wrapping
      // one character per line. columnWidths (the tblGrid) plus a matching
      // per-cell width keep both readers consistent.
      columnWidths: [HEADER_LOGO_CELL_TWIPS, HEADER_NAME_CELL_TWIPS],
      borders: {
        top: NO_BORDER,
        bottom: NO_BORDER,
        left: NO_BORDER,
        right: NO_BORDER,
        insideHorizontal: NO_BORDER,
        insideVertical: NO_BORDER,
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: HEADER_LOGO_CELL_TWIPS, type: WidthType.DXA },
              verticalAlign: VerticalAlign.CENTER,
              children: [logoParagraph],
            }),
            new TableCell({
              width: { size: HEADER_NAME_CELL_TWIPS, type: WidthType.DXA },
              verticalAlign: VerticalAlign.CENTER,
              children: nameParagraphs,
            }),
          ],
        }),
      ],
    }),
    buildDividerParagraph(),
  ];
}

/** A single location as one centered paragraph with line breaks — matches the
 * real-world reference format (bold city name, then address, then phone). */
function buildLocationParagraph(loc: Location): Paragraph {
  const phoneLine = [
    loc.phone && `Office: ${loc.phone}`,
    loc.fax && `Fax: ${loc.fax}`,
  ]
    .filter(Boolean)
    .join("  ·  ");

  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 0 },
    children: [
      new TextRun({
        text: loc.name.toUpperCase(),
        bold: true,
        size: 17,
        color: BRAND_NAVY,
      }),
      ...(loc.address
        ? [new TextRun({ text: loc.address, size: 16, break: 1 })]
        : []),
      ...(phoneLine
        ? [new TextRun({ text: phoneLine, size: 16, break: 1 })]
        : []),
    ],
  });
}

function buildFooterContent(
  facilityInfo: FacilityInfo,
  locations: Location[],
): (Paragraph | Table)[] {
  const content: (Paragraph | Table)[] = [buildDividerParagraph()];

  if (locations.length === 1) {
    content.push(buildLocationParagraph(locations[0]));
  } else if (locations.length > 1) {
    const colWidth = Math.floor(CONTENT_WIDTH_TWIPS / locations.length);
    content.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: locations.map(() => colWidth),
        alignment: AlignmentType.CENTER,
        borders: {
          top: NO_BORDER,
          bottom: NO_BORDER,
          left: NO_BORDER,
          right: NO_BORDER,
          insideHorizontal: NO_BORDER,
          insideVertical: NO_BORDER,
        },
        rows: [
          new TableRow({
            children: locations.map(
              (loc, index) =>
                new TableCell({
                  width: { size: colWidth, type: WidthType.DXA },
                  verticalAlign: VerticalAlign.CENTER,
                  borders: {
                    top: NO_BORDER,
                    bottom: NO_BORDER,
                    left: NO_BORDER,
                    right:
                      index < locations.length - 1
                        ? COLUMN_DIVIDER_BORDER
                        : NO_BORDER,
                  },
                  children: [buildLocationParagraph(loc)],
                }),
            ),
          }),
        ],
      }),
    );
  }

  if (facilityInfo.tagline) {
    content.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 0 },
        children: [
          new TextRun({
            text: facilityInfo.tagline,
            bold: true,
            italics: true,
            size: 17,
          }),
        ],
      }),
    );
  }

  if (facilityInfo.website) {
    content.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 0 },
        children: [
          new TextRun({ text: facilityInfo.website, size: 16, color: BRAND_NAVY }),
        ],
      }),
    );
  }

  content.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 40 },
      children: [
        new TextRun({ text: "Page ", size: 14, color: "999999" }),
        new TextRun({ children: [PageNumber.CURRENT], size: 14, color: "999999" }),
        new TextRun({ text: " of ", size: 14, color: "999999" }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 14, color: "999999" }),
      ],
    }),
  );

  return content;
}

function buildPatientTable(included: BookmarkName[]): Table {
  const rows: VisibleRow[] = computeVisibleRows(included);

  const tableRows = rows.map(
    (row) =>
      new TableRow({
        children: [
          buildLabelCell(row.left, LABEL_COL_TWIPS),
          buildValueCell(row.left, VALUE_COL_TWIPS),
          buildLabelCell(row.right, LABEL2_COL_TWIPS),
          buildValueCell(row.right, VALUE2_COL_TWIPS),
        ],
      }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: NO_BORDER,
      bottom: NO_BORDER,
      left: NO_BORDER,
      right: NO_BORDER,
      insideVertical: NO_BORDER,
      insideHorizontal: ROW_BORDER,
    },
    rows: tableRows,
  });

  function buildLabelCell(name: BookmarkName | null, width: number) {
    return new TableCell({
      width: { size: width, type: WidthType.DXA },
      children: [
        new Paragraph({
          children: name
            ? [
                new TextRun({
                  text: getBookmarkDefinition(name).label,
                  bold: true,
                  size: 18,
                }),
              ]
            : [],
        }),
      ],
    });
  }

  function buildValueCell(name: BookmarkName | null, width: number) {
    return new TableCell({
      width: { size: width, type: WidthType.DXA },
      children: [
        new Paragraph({
          children: name
            ? [new Bookmark({ id: name, children: [] })]
            : [],
        }),
      ],
    });
  }
}

export function buildDocument(
  data: DotxWizardData,
  bakedLogo: BakedImage | null,
): Document {
  const logoRunForDefault = buildLogoImageRun(bakedLogo);
  const logoRunForFirst = buildLogoImageRun(bakedLogo);

  const bodyChildren: FileChild[] = [
    buildPatientTable(data.bookmarkConfig.included),
    new Paragraph({
      children: [new Bookmark({ id: "Body", children: [] })],
    }),
    new Paragraph({
      children: [new TextRun(VERSION_MARKER)],
    }),
  ];

  const pageOneDifferent = data.headerLayout.pageOneDifferent;

  const doc = new Document({
    sections: [
      {
        properties: {
          titlePage: pageOneDifferent,
        },
        headers: {
          default: new Header({
            children: buildHeaderContent(
              data.facilityInfo,
              logoRunForDefault,
              data.headerLayout,
              "default",
            ),
          }),
          ...(pageOneDifferent
            ? {
                first: new Header({
                  children: buildHeaderContent(
                    data.facilityInfo,
                    logoRunForFirst,
                    data.headerLayout,
                    "first",
                  ),
                }),
              }
            : {}),
        },
        footers: {
          default: new Footer({
            children: buildFooterContent(data.facilityInfo, data.locations),
          }),
          ...(pageOneDifferent
            ? {
                first: new Footer({
                  children: buildFooterContent(
                    data.facilityInfo,
                    data.locations,
                  ),
                }),
              }
            : {}),
        },
        children: bodyChildren,
      },
    ],
  });

  return doc;
}
