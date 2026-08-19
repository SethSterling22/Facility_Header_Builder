/**
 * Regression check for the generated .dotx, run outside the browser.
 *
 * Builds a few representative templates through the real pipeline and asserts
 * the rules from the header-template skill hold in the produced OOXML —
 * Arial 12 with bold labels, widened label columns, a line above and below
 * every info block, the V3 marker, Addendum ordering, and image relationships
 * that start at rId1 (rId0 renders in Word but is dropped by RamSoft).
 *
 *   npm run verify:dotx
 */
import { Packer } from "docx";
import JSZip from "jszip";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deflateSync } from "node:zlib";
import { buildDocument, type DotxWizardData } from "../lib/dotx/buildDocument";
import { finalizePackage } from "../lib/dotx/finalizePackage";
import { TABLE_COLUMN_WIDTHS, type TableBookmarkName } from "../lib/dotx/bookmarks";
import type { BakedImage } from "../lib/dotx/bakeLogo";

const OUT_DIR = join(tmpdir(), "facility-header-builder-verify");

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}

/**
 * A real, decodable solid-colour PNG. Hand-written base64 fixtures are easy to
 * get subtly wrong, and an undecodable image would mask the very rendering
 * problems this script exists to catch.
 */
function makeSolidPng(width: number, height: number): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour RGB
  // 10-12: compression, filter, interlace — all 0.

  const stride = width * 3 + 1; // one filter byte per scanline
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * stride;
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const p = rowStart + 1 + x * 3;
      raw[p] = 0x1b;
      raw[p + 1] = 0x3a;
      raw[p + 2] = 0x6b;
    }
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

const LOGO_PNG = makeSolidPng(240, 80);
const LOGO: BakedImage = {
  dataUrl: `data:image/png;base64,${LOGO_PNG.toString("base64")}`,
  width: 240,
  height: 80,
};

const INCLUDED: TableBookmarkName[] = [
  "PatientName",
  "PatientID",
  "PatientDOB",
  "PatientSex",
  "ExamDate",
  "ExamDesc",
  "Accession",
  "RefPhysicianName",
];

let failures = 0;

function check(name: string, condition: boolean, detail = ""): void {
  if (condition) {
    console.log(`  ✓ ${name}`);
    return;
  }
  failures++;
  console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
}

type Scenario = {
  name: string;
  data: DotxWizardData;
  withLogo: boolean;
};

async function verify({ name, data, withLogo }: Scenario): Promise<string> {
  console.log(`\n=== ${name} ===`);

  const doc = buildDocument(data, withLogo ? LOGO : null);
  const docxBuffer = await Packer.toBuffer(doc);
  const { blob, notes } = await finalizePackage(docxBuffer as unknown as Blob);
  const buf = Buffer.from(await blob.arrayBuffer());
  await writeFile(join(OUT_DIR, `${name}.dotx`), buf);

  const zip = await JSZip.loadAsync(buf);
  const read = async (path: string): Promise<string> => {
    const file = zip.file(path);
    return file ? file.async("string") : "";
  };
  const partsMatching = (pattern: RegExp) =>
    Object.keys(zip.files).filter((p) => pattern.test(p));

  const contentTypes = await read("[Content_Types].xml");
  const documentXml = await read("word/document.xml");
  const stylesXml = await read("word/styles.xml");

  check("content-type is a Word template", contentTypes.includes("template.main+xml"));
  check(
    "all 9 standard bookmarks present",
    [...INCLUDED, "Body"].every((b) => documentXml.includes(`w:name="${b}"`)),
  );
  check("V3 marker intact", documentXml.includes(">V3</w:t>"));
  check("body set in Arial", documentXml.includes('w:ascii="Arial"'));
  check("body set at 12pt (sz 24)", documentXml.includes('w:sz w:val="24"'));
  check("field labels bold", documentXml.includes("<w:b/>"));
  check("styles.xml defaults to Arial", stylesXml.includes('w:ascii="Arial"'));
  check(
    `label columns widened (${TABLE_COLUMN_WIDTHS.label1}/${TABLE_COLUMN_WIDTHS.label2})`,
    documentXml.includes(`w:w="${TABLE_COLUMN_WIDTHS.label1}"`) &&
      documentXml.includes(`w:w="${TABLE_COLUMN_WIDTHS.label2}"`),
  );

  const tableBorders =
    documentXml.match(/<w:tblBorders>[\s\S]*?<\/w:tblBorders>/)?.[0] ?? "";
  check(
    "patient table has a line above AND below",
    /<w:top w:val="single"/.test(tableBorders) &&
      /<w:bottom w:val="single"/.test(tableBorders),
  );

  // Cell-level borders override table-level ones in OOXML, so a footer block
  // can silently lose its top/bottom rule even when the table declares it.
  for (const path of partsMatching(/^word\/footer\d+\.xml$/)) {
    const footerXml = await read(path);
    if (!footerXml.includes("<w:tblBorders>")) continue;
    const cellBorderBlocks = [
      ...footerXml.matchAll(/<w:tcBorders>[\s\S]*?<\/w:tcBorders>/g),
    ].map((m) => m[0]);
    check(
      `${path}: multi-location block keeps its line above AND below`,
      cellBorderBlocks.length === 0 ||
        cellBorderBlocks.every(
          (b) =>
            /<w:top w:val="single"/.test(b) &&
            /<w:bottom w:val="single"/.test(b),
        ),
    );
  }

  if (data.bookmarkConfig.includeAddendum) {
    check("Addendum bookmark present", documentXml.includes('w:name="Addendum"'));
    check(
      "Addendum precedes Body (renders at top)",
      documentXml.indexOf('w:name="Addendum"') <
        documentXml.indexOf('w:name="Body"'),
    );
  }

  // Page geometry: docx defaults to A4, which is too narrow for the table.
  const pageSize = documentXml.match(/<w:pgSz w:w="(\d+)" w:h="(\d+)"/);
  const pageWidth = Number(pageSize?.[1] ?? 0);
  check("page size is US Letter", pageWidth === 12240 && pageSize?.[2] === "15840",
    pageSize ? `got ${pageSize[1]}x${pageSize[2]}` : "no pgSz");

  const margins = documentXml.match(/<w:pgMar w:top="\d+" w:right="(\d+)"[^>]*w:left="(\d+)"/);
  const printable =
    pageWidth - Number(margins?.[1] ?? 0) - Number(margins?.[2] ?? 0);
  const tableWidth = Number(
    documentXml.match(/<w:tblW w:type="dxa" w:w="(\d+)"/)?.[1] ?? 0,
  );
  check(
    "patient table fits the printable width",
    tableWidth > 0 && tableWidth <= printable,
    `table ${tableWidth} vs printable ${printable}`,
  );

  // Duplicate bookmark IDs are invalid OOXML and this is a bookmark-driven
  // merge engine, so they have to be unique across every part.
  const allBookmarkIds: string[] = [];
  for (const path of partsMatching(
    /^word\/(document|header\d+|footer\d+)\.xml$/,
  )) {
    const xml = await read(path);
    allBookmarkIds.push(
      ...[...xml.matchAll(/<w:bookmarkStart[^>]*w:id="(\d+)"/g)].map((m) => m[1]),
    );
  }
  check(
    "bookmark w:id values are unique document-wide",
    new Set(allBookmarkIds).size === allBookmarkIds.length,
    `${allBookmarkIds.length} bookmarks, ${new Set(allBookmarkIds).size} unique`,
  );

  check(
    "no empty text runs",
    !documentXml.includes("></w:t>") &&
      !(await read("word/header1.xml")).includes("></w:t>"),
  );

  // Every known-good template ships the Office theme part; docx omits it.
  const themeXml = await read("word/theme/theme1.xml");
  check("theme1.xml is present", themeXml.includes("<a:theme"));
  check(
    "theme is declared and related",
    contentTypes.includes("theme+xml") &&
      (await read("word/_rels/document.xml.rels")).includes(
        "relationships/theme",
      ),
  );

  let imageRelCount = 0;
  for (const path of partsMatching(/^word\/_rels\/(header|footer)\d+\.xml\.rels$/)) {
    const xml = await read(path);
    check(`${path}: no rId0`, !xml.includes('Id="rId0"'));
    imageRelCount += [...xml.matchAll(/relationships\/image/g)].length;
  }
  if (withLogo) {
    check("logo image relationship written", imageRelCount > 0);
  }

  for (const path of partsMatching(/^word\/(header|footer)\d+\.xml$/)) {
    const partXml = await read(path);
    check(`${path}: image is inline, not anchored`, !partXml.includes("<wp:anchor"));

    const embeds = [...partXml.matchAll(/r:embed="(rId\d+)"/g)].map((m) => m[1]);
    if (embeds.length === 0) continue;
    const relsXml = await read(`${path.replace("word/", "word/_rels/")}.rels`);
    check(
      `${path}: every r:embed resolves to a declared relationship`,
      embeds.every((id) => relsXml.includes(`Id="${id}"`)),
      `embeds=${embeds.join(",")}`,
    );
  }

  if (notes.length > 0) console.log(`  · ${notes.join("\n  · ")}`);
  return documentXml;
}

const baseData: DotxWizardData = {
  facilityInfo: {
    name: "Sebastian Imaging",
    tagline: "We Imaging",
    phone: "850-747-8822",
    fax: "850-747-8664",
    website: "www.sebastianimaging.com",
  },
  locations: [
    {
      id: "1",
      name: "Panama City",
      address: "511 East 23rd Street, Panama City FL 32405",
      phone: "850-747-8822",
      fax: "850-747-8664",
    },
  ],
  headerLayout: {
    arrangement: "logo-only",
    pageOneDifferent: false,
    contactPlacement: "footer",
  },
  bookmarkConfig: { included: INCLUDED, includeAddendum: false },
  expertRadiology: { include: false, placement: "footer" },
  logoWidthInches: 2.3,
};

await mkdir(OUT_DIR, { recursive: true });

await verify({ name: "default-logo-only", data: baseData, withLogo: true });

await verify({
  name: "addendum-and-expert-footer",
  data: {
    ...baseData,
    bookmarkConfig: { included: INCLUDED, includeAddendum: true },
    expertRadiology: { include: true, placement: "footer" },
  },
  withLogo: true,
});

await verify({
  name: "two-locations-title-page",
  data: {
    ...baseData,
    locations: [
      ...baseData.locations,
      {
        id: "2",
        name: "Laredo",
        address: "10901 International Blvd, Ste 600, Laredo TX 78045",
        phone: "956-427-5849",
        fax: "",
      },
    ],
    headerLayout: {
      arrangement: "logo-left-name-right",
      pageOneDifferent: true,
      contactPlacement: "footer",
    },
  },
  withLogo: true,
});

await verify({
  name: "logo-beside-address-large-logo",
  data: {
    ...baseData,
    headerLayout: {
      arrangement: "logo-left-address-right",
      pageOneDifferent: false,
      contactPlacement: "header",
    },
    // A deliberately large logo: real templates go up to 7.36in wide.
    logoWidthInches: 6,
  },
  withLogo: true,
});

await verify({
  name: "contact-in-header-no-logo",
  data: {
    ...baseData,
    headerLayout: {
      arrangement: "logo-centered-stacked",
      pageOneDifferent: false,
      contactPlacement: "header",
    },
    expertRadiology: { include: true, placement: "beside-logo" },
  },
  withLogo: false,
});

console.log(
  failures === 0
    ? `\n✅ All checks passed. Files written to ${OUT_DIR}`
    : `\n❌ ${failures} check(s) failed.`,
);
process.exit(failures === 0 ? 0 : 1);
