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

    // Scoped to the attributes that actually hold relationship IDs, and done
    // in a single pass so remapped IDs can't cascade into each other.
    const remap = (xml: string, attributePattern: RegExp) =>
      xml.replace(attributePattern, (match, prefix: string, id: string) =>
        idMap.has(id) ? `${prefix}"${idMap.get(id)}"` : match,
      );

    zip.file(relsPath, remap(relsXml, /(\bId=)"(rId\d+)"/g));

    const partPath = relsPathToPartPath(relsPath);
    const partFile = zip.file(partPath);
    if (partFile) {
      zip.file(
        partPath,
        remap(
          await partFile.async("string"),
          /(\br:(?:embed|id|link)=)"(rId\d+)"/g,
        ),
      );
    }

    notes.push(
      `Renumbered ${ids.length} relationship(s) in ${partPath} to start at rId1.`,
    );
  }

  return notes;
}

/** Parts that can legally contain bookmarks. */
const BOOKMARK_PART_PATTERN = /^word\/(document|header\d+|footer\d+)\.xml$/;

/**
 * `docx` stamps every bookmark with `w:id="1"`. Duplicate bookmark IDs anywhere
 * in the package are invalid OOXML — Word quietly copes, but RamSoft's whole
 * job is resolving these bookmarks, so it gets a well-formed set of unique IDs.
 *
 * Start/end pairs are matched as a stack rather than by ID, since the IDs we're
 * replacing are ambiguous by definition.
 */
async function normalizeBookmarkIds(zip: JSZip): Promise<string[]> {
  const notes: string[] = [];
  let nextId = 1;

  for (const path of Object.keys(zip.files).filter((p) =>
    BOOKMARK_PART_PATTERN.test(p),
  )) {
    const file = zip.file(path);
    if (!file) continue;
    const xml = await file.async("string");
    if (!xml.includes("<w:bookmarkStart")) continue;

    const openIds: number[] = [];
    let renamed = 0;

    const updated = xml.replace(
      /<w:bookmark(Start|End)\b[^>]*?\/>/g,
      (tag, kind: string) => {
        if (kind === "Start") {
          const id = nextId++;
          openIds.push(id);
          renamed++;
          return tag.replace(/w:id="\d+"/, `w:id="${id}"`);
        }
        const id = openIds.pop();
        if (id === undefined) return tag;
        return tag.replace(/w:id="\d+"/, `w:id="${id}"`);
      },
    );

    if (openIds.length > 0) {
      throw new Error(
        `${path} has ${openIds.length} unclosed bookmark(s); refusing to emit an invalid template.`,
      );
    }

    zip.file(path, updated);
    notes.push(`Assigned unique IDs to ${renamed} bookmark(s) in ${path}.`);
  }

  return notes;
}

/**
 * Turns the `.docx` package the `docx` Packer produces into a RamSoft-valid
 * `.dotx`: flips the main-document content-type to the template type and
 * normalizes header/footer relationship IDs and bookmark IDs.
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

  const notes = [
    ...(await normalizeRelationshipIds(zip)),
    ...(await normalizeBookmarkIds(zip)),
  ];

  const out = await zip.generateAsync({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
  });

  return { blob: out, notes };
}

export { DOTX_CONTENT_TYPE };
