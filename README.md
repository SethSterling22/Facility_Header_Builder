# Facility Header Builder

A self-service wizard for Expert Radiology™ facilities to create and edit
their own RamSoft report header/footer — with a live preview — and download
a ready-to-use `.dotx` template. Replaces the manual, back-and-forth process
of hand-building headers in Word.

## What it does

- **Wizard-based creation and editing**, using the same flow for both: start
  from scratch or import an existing `.dotx` to pre-fill the wizard.
- **Live full-page preview** that mirrors the eventual RamSoft report
  (header, patient-data table with sample data, footer) and stays in sync
  with every edit.
- **Client-side `.dotx` generation** — no server round-trip. The output is a
  real, RamSoft-ready Word template, validated before download.

Everything runs in the browser: there is no backend, database, or auth in
this MVP.

## Tech stack

- [Next.js](https://nextjs.org) (App Router, static export) + TypeScript
- Tailwind CSS v4
- [Zustand](https://github.com/pmndrs/zustand) for wizard state
- [react-hook-form](https://react-hook-form.com) + [Zod](https://zod.dev) for form validation
- [react-cropper](https://github.com/react-cropper/react-cropper) for logo crop/zoom/adjustments
- [`docx`](https://docx.js.org) + [`jszip`](https://stuk.github.io/jszip/) for generating and importing `.dotx` files entirely client-side

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Start
building**, or go straight to `/builder`.

Other scripts:

```bash
npm run build        # production build (static export to ./out)
npm run start        # serve the production build locally
npm run lint         # eslint
npm run verify:dotx  # regression-check the generated .dotx against the RamSoft rules
```

## How the wizard works

| Step | What happens |
|---|---|
| Start | Choose to start from scratch, or import an existing `.dotx` (parsed client-side to pull out the logo, addresses, and already-selected fields). |
| Facility Info | Name, tagline, primary phone/fax, website. |
| Logo | Upload, crop/zoom, and adjust brightness/contrast/saturation. |
| Locations | Add one or more locations for the report footer. |
| Header Layout | Logo/name arrangement, where the facility's contact info goes (footer by default), an optional distinct header for page 1, and the opt-in Expert Radiology block. |
| Report Fields | Choose which of the 8 RamSoft table bookmarks appear, plus the optional `Addendum` field. |
| Review & Generate | Validates and downloads the final `.dotx`. |

The live preview renders the page at true Letter proportions in Arial 12, so
what you see matches the generated document rather than approximating it.

## `.dotx` generation & import

The generated file has to be a real RamSoft-compatible Word **template**
(`.dotx`, not `.docx`), so a set of rules is non-negotiable and enforced in
[`lib/dotx/`](./lib/dotx):

- `[Content_Types].xml` is patched to the template content-type, and
  header/footer image relationships are renumbered to start at `rId1` — see
  [`finalizePackage.ts`](./lib/dotx/finalizePackage.ts). The `docx` package
  emits `rId0` for header images, which Word tolerates but RamSoft silently
  drops, making the logo vanish on the generated report.
- The patient-data table is **Arial 12pt with bold field labels**, with
  widened label columns (2200/3000 twips) so `Referring Physician:` doesn't
  wrap. Arial is also set as the document default in `styles.xml`.
- **Every bordered info block gets a line above _and_ below** — both the
  patient-data table and the facility's contact block. Note that cell-level
  borders override table-level ones in OOXML, so multi-location footers set
  them per cell.
- The 8 table bookmarks (`PatientName`, `PatientID`, `PatientDOB`,
  `PatientSex`, `ExamDate`, `ExamDesc`, `Accession`, `RefPhysicianName`) plus
  `Body`, and the optional `Addendum` — see [`bookmarks.ts`](./lib/dotx/bookmarks.ts).
  When `Addendum` is enabled its paragraph is emitted **before** `Body`, since
  RamSoft renders document order.
- Logos are embedded as inline images, never anchored, so the header can't
  overlap the patient-data table. Surrounding whitespace is trimmed first.
- Expert Radiology's own contact block is **opt-in and off by default** — this
  template is branded for the facility. When enabled, it's written without a
  `+1` prefix or `https://`.
- The `V3` version marker is a fixed constant, never user-editable.
- [`generateDotx.ts`](./lib/dotx/generateDotx.ts) re-opens the finished package
  and validates it before the download starts.

[`lib/import/`](./lib/import) does the reverse for the import flow: it reads
an uploaded `.dotx` with JSZip/DOMParser and pre-fills the wizard, surfacing
any extracted text for the user to confirm rather than trusting it silently.

> **Note on RamSoft verification:** a template that validates here and renders
> correctly in Word/LibreOffice is still not proof it behaves as expected in
> RamSoft. Only a real RamSoft-generated report, produced *after* the template
> is swapped in, confirms that.

## Deployment

The app builds to a static export and is served by nginx in a container —
see [`Dockerfile`](./Dockerfile) and [`nginx.conf`](./nginx.conf).

```bash
docker build -t facility-header-builder .
docker run -p 8080:8080 facility-header-builder
```

The container serves on **port 8080** — `nginx.conf`, the Dockerfile's
`EXPOSE`, and the Container App's target port all have to agree on that.

[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) runs on every
push to `main`: it builds, runs `verify:dotx`, pushes the image to **GitHub
Container Registry**, and points the **Azure Container App** at the new tag.
Authentication is **OIDC** — there are no long-lived credentials, so the only
repository secrets needed are:

| Secret | Purpose |
|---|---|
| `AZURE_CLIENT_ID` | App registration federated to this repo |
| `AZURE_TENANT_ID` | Directory (tenant) ID |
| `AZURE_SUBSCRIPTION_ID` | Target subscription |

GHCR pushes use the workflow's built-in `GITHUB_TOKEN`, so no registry
username or password is stored.

See [`docs/deployment-azure.md`](./docs/deployment-azure.md) for the one-time
setup (federated credentials, role assignment, ingress) and troubleshooting.

## License

MIT — see [LICENSE](./LICENSE).
