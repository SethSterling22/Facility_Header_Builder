import type { ParsedTemplate } from "./parseDotx";

const PHONE_PATTERN = /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
const URL_PATTERN = /((https?:\/\/)?(www\.)?[a-z0-9-]+\.[a-z]{2,}(\/\S*)?)/i;

function makeId() {
  return `loc-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Light regex heuristics to pre-fill the wizard from an imported template's
 * raw header/footer text — never trusted as final. Every raw line is also
 * surfaced (importedRawLines) so the user can confirm/correct it themselves.
 */
export function mapImportToWizardState(parsed: ParsedTemplate) {
  let phone: string | undefined;
  let website: string | undefined;
  const remainingLines: string[] = [];

  for (const line of parsed.rawTextLines) {
    const phoneMatch = !phone && line.match(PHONE_PATTERN);
    if (phoneMatch) {
      phone = phoneMatch[0];
      continue;
    }
    const urlMatch = !website && line.match(URL_PATTERN);
    if (urlMatch) {
      website = urlMatch[0];
      continue;
    }
    remainingLines.push(line);
  }

  const facilityName = remainingLines[0] ?? "";
  const addressLines = remainingLines.slice(1);

  return {
    facilityInfo: {
      name: facilityName,
      phone: phone ?? "",
      website: website ?? "",
    },
    logo: { dataUrl: parsed.logoDataUrl },
    locations:
      addressLines.length > 0
        ? [
            {
              id: makeId(),
              name: facilityName,
              address: addressLines.join(", "),
              phone: phone ?? "",
              fax: "",
            },
          ]
        : undefined,
    headerLayout: { pageOneDifferent: parsed.hasPageOneVariant },
    bookmarkConfig:
      parsed.includedBookmarks.length > 0
        ? { included: parsed.includedBookmarks }
        : undefined,
    importedRawLines: parsed.rawTextLines,
  };
}
