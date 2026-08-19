import JSZip from "jszip";
import {
  BOOKMARK_DEFINITIONS,
  type TableBookmarkName,
} from "@/lib/dotx/bookmarks";

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const R_NS =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const REL_NS =
  "http://schemas.openxmlformats.org/package/2006/relationships";

export type ParsedTemplate = {
  logoDataUrl: string | null;
  rawTextLines: string[];
  includedBookmarks: TableBookmarkName[];
  /** Templates carrying the optional 10th bookmark keep it on re-export. */
  hasAddendum: boolean;
  hasPageOneVariant: boolean;
};

function parseXml(xml: string): Document {
  return new DOMParser().parseFromString(xml, "application/xml");
}

async function readRelsMap(
  zip: JSZip,
  relsPath: string,
): Promise<Record<string, string>> {
  const file = zip.file(relsPath);
  if (!file) return {};
  const xml = await file.async("string");
  const doc = parseXml(xml);
  const map: Record<string, string> = {};
  for (const rel of Array.from(
    doc.getElementsByTagNameNS(REL_NS, "Relationship"),
  )) {
    const id = rel.getAttribute("Id");
    const target = rel.getAttribute("Target");
    if (id && target) map[id] = target;
  }
  return map;
}

function resolveRelativeTarget(basePart: string, target: string): string {
  if (target.startsWith("/")) return target.slice(1);
  const baseDir = basePart.split("/").slice(0, -1).join("/");
  const parts = `${baseDir}/${target}`.split("/");
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === "." || part === "") continue;
    if (part === "..") resolved.pop();
    else resolved.push(part);
  }
  return resolved.join("/");
}

function extractTextLines(doc: Document): string[] {
  const lines: string[] = [];
  for (const p of Array.from(doc.getElementsByTagNameNS(W_NS, "p"))) {
    const text = Array.from(p.getElementsByTagNameNS(W_NS, "t"))
      .map((t) => t.textContent ?? "")
      .join("")
      .trim();
    if (text) lines.push(text);
  }
  return lines;
}

function extractAllBookmarkNames(doc: Document): string[] {
  return Array.from(doc.getElementsByTagNameNS(W_NS, "bookmarkStart"))
    .map((bm) => bm.getAttributeNS(W_NS, "name"))
    .filter((name): name is string => Boolean(name));
}

function extractTableBookmarks(names: string[]): TableBookmarkName[] {
  const known = new Set<string>(BOOKMARK_DEFINITIONS.map((b) => b.name));
  const found: TableBookmarkName[] = [];
  for (const name of names) {
    if (known.has(name) && !found.includes(name as TableBookmarkName)) {
      found.push(name as TableBookmarkName);
    }
  }
  return found;
}

function mimeFromExtension(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "bmp":
      return "image/bmp";
    default:
      return "image/png";
  }
}

async function extractFirstEmbeddedImage(
  zip: JSZip,
  partPath: string,
): Promise<string | null> {
  const file = zip.file(partPath);
  if (!file) return null;
  const xml = await file.async("string");
  const doc = parseXml(xml);
  const blip = doc.getElementsByTagName("a:blip")[0];
  const embedId = blip?.getAttributeNS(R_NS, "embed");
  if (!embedId) return null;

  const relsPath = partPath.replace(/([^/]+)$/, "_rels/$1.rels");
  const relsMap = await readRelsMap(zip, relsPath);
  const target = relsMap[embedId];
  if (!target) return null;

  const mediaPath = resolveRelativeTarget(partPath, target);
  const mediaFile = zip.file(mediaPath);
  if (!mediaFile) return null;

  const base64 = await mediaFile.async("base64");
  return `data:${mimeFromExtension(mediaPath)};base64,${base64}`;
}

/**
 * Parses an uploaded RamSoft .dotx to pre-fill the wizard. This is inherently
 * heuristic for free-form header/footer text (see rawTextLines) — never
 * treated as final without the user confirming it, per the header-template
 * skill's own rule about not trusting inferred data silently.
 */
export async function parseDotx(file: File): Promise<ParsedTemplate> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());

  const documentFile = zip.file("word/document.xml");
  if (!documentFile) {
    throw new Error(
      "That doesn't look like a valid Word package — word/document.xml is missing.",
    );
  }

  const documentXml = await documentFile.async("string");
  const documentDoc = parseXml(documentXml);

  const sectPr = documentDoc.getElementsByTagNameNS(W_NS, "sectPr")[0];
  const titlePg = sectPr?.getElementsByTagNameNS(W_NS, "titlePg")[0];
  const hasPageOneVariant = Boolean(titlePg);

  const docRelsMap = await readRelsMap(
    zip,
    "word/_rels/document.xml.rels",
  );

  const headerRefs = sectPr
    ? Array.from(sectPr.getElementsByTagNameNS(W_NS, "headerReference"))
    : [];

  // Prefer the "first" header (if a title-page variant exists) since that's
  // typically where the full branding/logo lives; fall back to "default".
  const sortedRefs = [...headerRefs].sort((a, b) => {
    const rank = (ref: Element) =>
      ref.getAttributeNS(W_NS, "type") === "first" ? 0 : 1;
    return rank(a) - rank(b);
  });

  let logoDataUrl: string | null = null;
  const rawTextLines: string[] = [];

  for (const ref of sortedRefs) {
    const rId = ref.getAttributeNS(R_NS, "id");
    if (!rId) continue;
    const target = docRelsMap[rId];
    if (!target) continue;
    const partPath = resolveRelativeTarget("word/document.xml", target);
    const partFile = zip.file(partPath);
    if (!partFile) continue;

    const partXml = await partFile.async("string");
    const partDoc = parseXml(partXml);
    rawTextLines.push(...extractTextLines(partDoc));

    if (!logoDataUrl) {
      logoDataUrl = await extractFirstEmbeddedImage(zip, partPath);
    }
  }

  const footerRefs = sectPr
    ? Array.from(sectPr.getElementsByTagNameNS(W_NS, "footerReference"))
    : [];
  for (const ref of footerRefs) {
    const rId = ref.getAttributeNS(R_NS, "id");
    if (!rId) continue;
    const target = docRelsMap[rId];
    if (!target) continue;
    const partPath = resolveRelativeTarget("word/document.xml", target);
    const partFile = zip.file(partPath);
    if (!partFile) continue;
    const partXml = await partFile.async("string");
    rawTextLines.push(...extractTextLines(parseXml(partXml)));
  }

  const allBookmarks = extractAllBookmarkNames(documentDoc);

  return {
    logoDataUrl,
    rawTextLines: Array.from(new Set(rawTextLines)),
    includedBookmarks: extractTableBookmarks(allBookmarks),
    hasAddendum: allBookmarks.includes("Addendum"),
    hasPageOneVariant,
  };
}
