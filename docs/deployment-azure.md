# Deploying to Azure

The app deploys to **Azure Container Apps**, with the image hosted on
**GitHub Container Registry (GHCR)** and GitHub Actions authenticating to
Azure via **OIDC** — no long-lived credentials stored anywhere.

[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) runs on every
push to `main`: it builds the static export, verifies the generated `.dotx`,
pushes the image to GHCR, and points the Container App at the new tag.

## Current setup

| Thing | Value |
|---|---|
| Container App | `facility-header-builder` |
| Resource group | `template-builder` |
| Image | `ghcr.io/sethsterling22/facility_header_builder` |
| Target port | `8080` (must match `EXPOSE` in the Dockerfile and `listen` in `nginx.conf`) |

These are set as `env:` in the workflow rather than secrets — none of them are
sensitive, and keeping them visible makes the workflow easier to follow.

## Required repository secrets

Only three, all for OIDC:

| Secret | What it is |
|---|---|
| `AZURE_CLIENT_ID` | Application (client) ID of the app registration federated to this repo |
| `AZURE_TENANT_ID` | Directory (tenant) ID |
| `AZURE_SUBSCRIPTION_ID` | Target subscription ID |

Check them with:

```bash
gh secret list --repo SethSterling22/Facility_Header_Builder
```

There is deliberately **no** `AZURE_CREDENTIALS`, and no registry
username/password: GHCR pushes use the workflow's built-in `GITHUB_TOKEN`,
and Azure login uses OIDC.

## One-time setup

### 1. Register the resource providers

A fresh subscription fails every `az ... create` with
`MissingSubscriptionRegistration` until its provider is registered. This is
per-subscription and only needs doing once:

```bash
az provider register --namespace Microsoft.App --wait && az provider register --namespace Microsoft.OperationalInsights --wait
```

Confirm both report `Registered`:

```bash
for ns in Microsoft.App Microsoft.OperationalInsights; do echo "$ns: $(az provider show -n $ns --query registrationState -o tsv)"; done
```

### 2. Federate the app registration to this repository

OIDC only works if the app registration trusts this specific repo and ref.
In the Azure Portal: **Microsoft Entra ID → App registrations → your app →
Certificates & secrets → Federated credentials → Add credential**, choosing
*GitHub Actions deploying Azure resources*, with:

- Organization: `SethSterling22`
- Repository: `Facility_Header_Builder`
- Entity type: **Branch**, name `main`

Add a second credential with entity type **Environment** or **Pull request**
only if you later deploy from those.

> If the workflow fails at the Azure login step with `AADSTS70021: No matching
> federated identity record found`, this is what's missing or mismatched —
> the subject has to match the branch/ref actually being deployed.

### 3. Give the service principal permission on the resource group

It needs to update the Container App:

```bash
CLIENT_ID=$(gh secret list --repo SethSterling22/Facility_Header_Builder >/dev/null && echo "<paste AZURE_CLIENT_ID>")
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

az role assignment create \
  --assignee "$CLIENT_ID" \
  --role Contributor \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/template-builder"
```

### 4. Let the Container App pull from GHCR

If the GHCR package is **public**, nothing to do — Container Apps pulls it
anonymously.

If it's **private**, give the app a pull credential using a GitHub personal
access token with `read:packages`:

```bash
az containerapp registry set \
  --name facility-header-builder \
  --resource-group template-builder \
  --server ghcr.io \
  --username <your-github-username> \
  --password <PAT with read:packages>
```

You can make the package public instead from the repo's **Packages** page →
the package → **Package settings** → *Change visibility*.

### 5. Expose the app publicly

The Container App currently has **internal** ingress, so it has no public URL.
To make it reachable:

```bash
az containerapp ingress enable \
  --name facility-header-builder \
  --resource-group template-builder \
  --type external \
  --target-port 8080 \
  --transport auto
```

Then print the URL:

```bash
az containerapp show --name facility-header-builder --resource-group template-builder \
  --query properties.configuration.ingress.fqdn -o tsv
```

## Deploying

Push to `main`, or trigger it by hand:

```bash
gh workflow run deploy.yml --repo SethSterling22/Facility_Header_Builder
gh run watch --repo SethSterling22/Facility_Header_Builder
```

## Running the container locally

```bash
docker build -t facility-header-builder .
docker run -p 8080:8080 facility-header-builder
```

Then open <http://localhost:8080>.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `Error: Username and password required` on a registry login step | The workflow is trying to use registry username/password secrets that don't exist. This setup uses `GITHUB_TOKEN` for GHCR — the workflow shouldn't reference `ACR_USERNAME`/`ACR_PASSWORD` at all. |
| `AADSTS70021: No matching federated identity record found` | The app registration has no federated credential matching this repo **and** ref — see step 2. |
| `MissingSubscriptionRegistration` on any `az ... create` | The resource provider named in the error isn't registered — see step 1. |
| Azure login succeeds but `az containerapp update` returns *AuthorizationFailed* | The service principal has no role on the resource group — see step 3. |
| Deploy succeeds but the app has no URL | Ingress is internal — see step 5. |
| Revision fails with an image pull error | The GHCR package is private and the app has no pull credential — see step 4. Also check the image reference isn't double-prefixed (e.g. `docker.io/ghcr.io/...`, which resolves to Docker Hub). |
| Site loads but `/builder` 404s | `nginx.conf`'s `try_files $uri $uri.html $uri/ =404;` resolves `/builder` to `/builder.html` from the static export — check it shipped in the image. |
