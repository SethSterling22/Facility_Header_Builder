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

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const ROW_BORDER = { style: BorderStyle.SINGLE, size: 4, color: "999999" };

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
    ];
  }

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
    ...(facilityInfo.tagline
      ? [
          new Paragraph({
            alignment:
              headerLayout.arrangement === "logo-centered-stacked"
                ? AlignmentType.CENTER
                : AlignmentType.RIGHT,
            children: [new TextRun({ text: facilityInfo.tagline, size: 18 })],
          }),
        ]
      : []),
  ];

  const logoParagraph = new Paragraph({
    alignment:
      headerLayout.arrangement === "logo-left-address-right"
        ? AlignmentType.LEFT
        : AlignmentType.CENTER,
    children: logoRun ? [logoRun] : [],
  });

  if (headerLayout.arrangement === "logo-only") {
    return [logoParagraph];
  }

  if (headerLayout.arrangement === "logo-centered-stacked") {
    return [logoParagraph, ...nameParagraphs];
  }

  // logo-left-address-right: a borderless 2-column table keeps the logo and
  // name/tagline as normal inline flowing content side by side — never
  // absolute/anchored positioning (see the header-template skill's overlap rule).
  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
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
              verticalAlign: VerticalAlign.CENTER,
              children: [logoParagraph],
            }),
            new TableCell({
              verticalAlign: VerticalAlign.CENTER,
              children: nameParagraphs,
            }),
          ],
        }),
      ],
    }),
  ];
}

function buildFooterContent(locations: Location[]): Paragraph[] {
  if (locations.length === 0) {
    return [
      new Paragraph({
        children: [
          new TextRun("Page "),
          new TextRun({ children: [PageNumber.CURRENT] }),
          new TextRun(" of "),
          new TextRun({ children: [PageNumber.TOTAL_PAGES] }),
        ],
      }),
    ];
  }

  const locationParagraphs = locations.flatMap((loc) => [
    new Paragraph({
      children: [
        new TextRun({ text: loc.name.toUpperCase(), bold: true, size: 16 }),
      ],
    }),
    ...(loc.address
      ? [new Paragraph({ children: [new TextRun({ text: loc.address, size: 16 })] })]
      : []),
    ...(loc.phone || loc.fax
      ? [
          new Paragraph({
            children: [
              new TextRun({
                text: [
                  loc.phone && `Office: ${loc.phone}`,
                  loc.fax && `Fax: ${loc.fax}`,
                ]
                  .filter(Boolean)
                  .join("  ·  "),
                size: 16,
              }),
            ],
          }),
        ]
      : []),
  ]);

  return [
    ...locationParagraphs,
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: "Page ", size: 16 }),
        new TextRun({ children: [PageNumber.CURRENT], size: 16 }),
        new TextRun({ text: " of ", size: 16 }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16 }),
      ],
    }),
  ];
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
            children: buildFooterContent(data.locations),
          }),
          ...(pageOneDifferent
            ? {
                first: new Footer({
                  children: buildFooterContent(data.locations),
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
