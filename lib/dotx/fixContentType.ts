import JSZip from "jszip";

const DOCX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml";
const DOTX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml";

/**
 * `docx`'s Packer always emits a regular .docx package. This is the one
 * mechanical fix needed to turn it into a RamSoft-valid .dotx: flip the
 * content-type override for /word/document.xml from "document" to "template".
 */
export async function fixContentType(blob: Blob): Promise<Blob> {
  const zip = await JSZip.loadAsync(blob);
  const contentTypesFile = zip.file("[Content_Types].xml");
  if (!contentTypesFile) {
    throw new Error("Generated package is missing [Content_Types].xml.");
  }
  const xml = await contentTypesFile.async("string");
  if (!xml.includes(DOCX_CONTENT_TYPE)) {
    throw new Error(
      "Could not find the expected document content-type to convert to a template.",
    );
  }
  const patched = xml.replace(DOCX_CONTENT_TYPE, DOTX_CONTENT_TYPE);
  zip.file("[Content_Types].xml", patched);
  return zip.generateAsync({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
  });
}

export { DOTX_CONTENT_TYPE };
