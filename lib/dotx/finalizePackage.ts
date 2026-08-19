import JSZip from "jszip";

const DOCX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml";
const DOTX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml";

/** Header/footer parts whose relationship IDs need normalizing. */
const PART_RELS_PATTERN = /^word\/_rels\/(header|footer)\d+\.xml\.rels$/;

function relsPathToPartPath(relsPath: string): string {
  // word/_rels/header1.xml.rels -> word/header1.xml
  return relsPath.replace("/_rels/", "/").replace(/\.rels$/, "");
}

/**
 * The `docx` package numbers header/footer image relationships from 0, emitting
 * `rId0`, while it correctly starts at `rId1` everywhere else (document,
 * footnotes, comments). Word and LibreOffice tolerate `rId0`, but stricter
 * consumers — RamSoft among them — silently drop the image, which is why a logo
 * that looks fine in Word never renders on the generated report.
 *
 * This renumbers each header/footer part's relationships to `rId1..rIdN` in
 * document order and rewrites the matching `r:embed` / `r:id` / `r:link`
 * references in the part itself.
 */
async function normalizeRelationshipIds(zip: JSZip): Promise<string[]> {
  const notes: string[] = [];
  const relsPaths = Object.keys(zip.files).filter((p) =>
    PART_RELS_PATTERN.test(p),
  );

  for (const relsPath of relsPaths) {
    const relsFile = zip.file(relsPath);
    if (!relsFile) continue;
    const relsXml = await relsFile.async("string");

    const ids = [...relsXml.matchAll(/\bId="(rId\d+)"/g)].map((m) => m[1]);
    if (ids.length === 0) continue;

    const idMap = new Map<string, string>();
    ids.forEach((oldId, index) => idMap.set(oldId, `rId${index + 1}`));

    const changed = [...idMap.entries()].some(([from, to]) => from !== to);
    if (!changed) continue;

    // Single-pass replace so remapped IDs can't cascade into each other.
    const remap = (xml: string) =>
      xml.replace(/\brId\d+\b/g, (match) => idMap.get(match) ?? match);

    zip.file(relsPath, remap(relsXml));

    const partPath = relsPathToPartPath(relsPath);
    const partFile = zip.file(partPath);
    if (partFile) {
      zip.file(partPath, remap(await partFile.async("string")));
    }

    notes.push(
      `Renumbered ${ids.length} relationship(s) in ${partPath} to start at rId1.`,
    );
  }

  return notes;
}

/**
 * Turns the `.docx` package the `docx` Packer produces into a RamSoft-valid
 * `.dotx`: flips the main-document content-type to the template type and
 * normalizes header/footer relationship IDs.
 */
export async function finalizePackage(
  blob: Blob,
): Promise<{ blob: Blob; notes: string[] }> {
  const zip = await JSZip.loadAsync(blob);

  const contentTypesFile = zip.file("[Content_Types].xml");
  if (!contentTypesFile) {
    throw new Error("Generated package is missing [Content_Types].xml.");
  }
  const contentTypesXml = await contentTypesFile.async("string");
  if (!contentTypesXml.includes(DOCX_CONTENT_TYPE)) {
    throw new Error(
      "Could not find the expected document content-type to convert to a template.",
    );
  }
  zip.file(
    "[Content_Types].xml",
    contentTypesXml.replace(DOCX_CONTENT_TYPE, DOTX_CONTENT_TYPE),
  );

  const notes = await normalizeRelationshipIds(zip);

  const out = await zip.generateAsync({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
  });

  return { blob: out, notes };
}

export { DOTX_CONTENT_TYPE };
