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
npm run build   # production build (static export to ./out)
npm run start   # serve the production build locally
npm run lint     # eslint
```

## How the wizard works

| Step | What happens |
|---|---|
| Start | Choose to start from scratch, or import an existing `.dotx` (parsed client-side to pull out the logo, addresses, and already-selected fields). |
| Facility Info | Name, tagline, primary phone/fax, website. |
| Logo | Upload, crop/zoom, and adjust brightness/contrast/saturation. |
| Locations | Add one or more locations for the report footer. |
| Header Layout | Logo/name arrangement, plus an optional distinct header for page 1 vs. later pages. |
| Report Fields | Choose which of the 9 RamSoft-approved bookmarks appear in the patient-data table (names are fixed; only inclusion is user-controlled). |
| Review & Generate | Validates and downloads the final `.dotx`. |

The live preview panel on the right reflects the same state at every step.

## `.dotx` generation & import

The generated file has to be a real RamSoft-compatible Word **template**
(`.dotx`, not `.docx`), so a few rules are non-negotiable and are enforced in
[`lib/dotx/`](./lib/dotx):

- `[Content_Types].xml` is patched to the template content-type after
  building the document with `docx` (see [`fixContentType.ts`](./lib/dotx/fixContentType.ts)).
- The patient-data table uses the 9 fixed RamSoft bookmarks
  (`PatientName`, `PatientID`, `PatientDOB`, `PatientSex`, `ExamDate`,
  `ExamDesc`, `Accession`, `RefPhysicianName`, `Body`) — see
  [`bookmarks.ts`](./lib/dotx/bookmarks.ts).
- Logos are embedded as inline images, never anchored, to avoid the header
  overlapping the patient-data table.
- The `V3` version marker is a fixed constant, never user-editable.
- [`generateDotx.ts`](./lib/dotx/generateDotx.ts) runs a validation pass
  (content-type + all selected bookmarks present) before the file downloads.

[`lib/import/`](./lib/import) does the reverse for the import flow: it reads
an uploaded `.dotx` with JSZip/DOMParser and pre-fills the wizard, surfacing
any extracted text for the user to confirm rather than trusting it silently.

## Deployment

The app builds to a static export and is served by nginx in a container —
see [`Dockerfile`](./Dockerfile) and [`nginx.conf`](./nginx.conf).

```bash
docker build -t facility-header-builder .
docker run -p 8080:80 facility-header-builder
```

[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) builds and
pushes the image to Azure Container Registry and deploys it to Azure
Container Apps on every push to `main`. It expects these repository secrets:

| Secret | Purpose |
|---|---|
| `ACR_LOGIN_SERVER` | Azure Container Registry login server |
| `ACR_USERNAME` / `ACR_PASSWORD` | ACR credentials |
| `ACR_NAME` | ACR resource name |
| `AZURE_CREDENTIALS` | Service principal credentials for `azure/login` |
| `CONTAINER_APP_NAME` | Target Container App name |
| `AZURE_RESOURCE_GROUP` | Resource group containing the Container App |

Setting all of this up for the first time (registry, Container App,
service principal, secrets)? See
[`docs/deployment-azure.md`](./docs/deployment-azure.md) for a full
step-by-step walkthrough.

## License

MIT — see [LICENSE](./LICENSE).
