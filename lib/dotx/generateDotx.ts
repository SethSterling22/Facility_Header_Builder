import { Packer } from "docx";
import JSZip from "jszip";
import { buildDocument, type DotxWizardData } from "./buildDocument";
import { finalizePackage, DOTX_CONTENT_TYPE } from "./finalizePackage";
import { bakeLogoImage } from "./bakeLogo";
import { DOC_FONT, VERSION_MARKER } from "./bookmarks";
import type { LogoState, ValidationResult } from "@/lib/store/wizardStore";

export type GenerateDotxInput = DotxWizardData & { logo: LogoState };

export type GenerateDotxResult = {
  blob: Blob;
  validation: ValidationResult;
};

async function readPart(zip: JSZip, path: string): Promise<string> {
  const file = zip.file(path);
  return file ? file.async("string") : "";
}

/**
 * Re-opens the finished package and asserts the things RamSoft actually cares
 * about. This deliberately checks the built artifact rather than the builder's
 * inputs, so a regression in the OOXML layer can't slip through.
 */
async function validateDotx(
  blob: Blob,
  expected: { bookmarks: string[]; includeAddendum: boolean; hasLogo: boolean },
): Promise<ValidationResult> {
  const messages: string[] = [];
  const zip = await JSZip.loadAsync(blob);

  const contentTypesXml = await readPart(zip, "[Content_Types].xml");
  if (!contentTypesXml.includes(DOTX_CONTENT_TYPE)) {
    messages.push("The package is not a Word template (.dotx) content-type.");
  }

  const documentXml = await readPart(zip, "word/document.xml");

  const requiredBookmarks = [...expected.bookmarks, "Body"];
  if (expected.includeAddendum) requiredBookmarks.push("Addendum");
  const missing = requiredBookmarks.filter(
    (name) => !documentXml.includes(`w:name="${name}"`),
  );
  if (missing.length > 0) {
    messages.push(`Missing expected bookmark(s): ${missing.join(", ")}.`);
  }

  if (expected.includeAddendum) {
    const addendumAt = documentXml.indexOf('w:name="Addendum"');
    const bodyAt = documentXml.indexOf('w:name="Body"');
    if (addendumAt > -1 && bodyAt > -1 && addendumAt > bodyAt) {
      messages.push(
        "Addendum must come before Body so addenda render at the top of the report.",
      );
    }
  }

  if (!documentXml.includes(`>${VERSION_MARKER}</w:t>`)) {
    messages.push(`The ${VERSION_MARKER} version marker is missing.`);
  }

  if (!documentXml.includes(`w:ascii="${DOC_FONT}"`)) {
    messages.push(`The patient-data table is not set in ${DOC_FONT}.`);
  }

  // Header/footer image relationships must start at rId1 — rId0 renders fine in
  // Word but is dropped by stricter consumers, which is what makes a logo
  // vanish on the generated report.
  const partPaths = Object.keys(zip.files).filter((p) =>
    /^word\/_rels\/(header|footer)\d+\.xml\.rels$/.test(p),
  );
  let imageRelCount = 0;
  for (const path of partPaths) {
    const xml = await readPart(zip, path);
    if (xml.includes('Id="rId0"')) {
      messages.push(`${path} still uses rId0, which RamSoft will not render.`);
    }
    imageRelCount += [...xml.matchAll(/relationships\/image/g)].length;
  }
  if (expected.hasLogo && imageRelCount === 0) {
    messages.push("A logo was provided but no image relationship was written.");
  }

  // Anchored images ignore the header's reserved area and can overlap the body.
  for (const path of Object.keys(zip.files).filter((p) =>
    /^word\/(header|footer)\d+\.xml$/.test(p),
  )) {
    if ((await readPart(zip, path)).includes("<wp:anchor")) {
      messages.push(`${path} uses an anchored image, which can overlap the body.`);
    }
  }

  return {
    status: messages.length === 0 ? "pass" : "fail",
    messages,
  };
}

export async function generateDotx(
  input: GenerateDotxInput,
): Promise<GenerateDotxResult> {
  const bakedLogo = input.logo.dataUrl
    ? await bakeLogoImage(input.logo.dataUrl, {
        brightness: input.logo.brightness,
        contrast: input.logo.contrast,
        saturation: input.logo.saturation,
      })
    : null;

  const document = buildDocument(input, bakedLogo);
  const docxBlob = await Packer.toBlob(document);
  const { blob } = await finalizePackage(docxBlob);
  const validation = await validateDotx(blob, {
    bookmarks: input.bookmarkConfig.included,
    includeAddendum: input.bookmarkConfig.includeAddendum,
    hasLogo: bakedLogo !== null,
  });

  return { blob, validation };
}
