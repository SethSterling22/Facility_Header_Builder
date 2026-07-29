import { Packer } from "docx";
import JSZip from "jszip";
import { buildDocument, type DotxWizardData } from "./buildDocument";
import { fixContentType, DOTX_CONTENT_TYPE } from "./fixContentType";
import { bakeLogoImage } from "./bakeLogo";
import type { LogoState, ValidationResult } from "@/lib/store/wizardStore";

export type GenerateDotxInput = DotxWizardData & { logo: LogoState };

export type GenerateDotxResult = {
  blob: Blob;
  validation: ValidationResult;
};

async function validateDotx(blob: Blob, expectedBookmarks: string[]) {
  const messages: string[] = [];
  const zip = await JSZip.loadAsync(blob);

  const contentTypesFile = zip.file("[Content_Types].xml");
  const contentTypesXml = contentTypesFile
    ? await contentTypesFile.async("string")
    : "";
  if (!contentTypesXml.includes(DOTX_CONTENT_TYPE)) {
    messages.push(
      "The package's content-type is not the RamSoft template type.",
    );
  }

  const documentXmlFile = zip.file("word/document.xml");
  const documentXml = documentXmlFile
    ? await documentXmlFile.async("string")
    : "";

  const missingBookmarks = [...expectedBookmarks, "Body"].filter(
    (name) => !documentXml.includes(`w:name="${name}"`),
  );
  if (missingBookmarks.length > 0) {
    messages.push(
      `Missing expected bookmark(s): ${missingBookmarks.join(", ")}.`,
    );
  }

  return {
    status: messages.length === 0 ? ("pass" as const) : ("fail" as const),
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
  const dotxBlob = await fixContentType(docxBlob);
  const validation = await validateDotx(
    dotxBlob,
    input.bookmarkConfig.included,
  );

  return { blob: dotxBlob, validation };
}
