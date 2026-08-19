# Deploying to Azure

This walks through the one-time Azure setup needed before
[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) can build
and deploy the app on every push to `main`. It's written assuming you have
**not** created any Azure resources for this project yet.

If the workflow already failed with `Error: Username and password required`
on the "Log in to Azure Container Registry" step, that just means the
`ACR_USERNAME`/`ACR_PASSWORD` secrets aren't set yet — jump to
[Configure GitHub secrets](#7-configure-the-github-repository-secrets) once
you've created the registry.

## Prerequisites

- An Azure subscription.
- The [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli)
  (`az`) installed and you're logged in: `az login`.
- The [GitHub CLI](https://cli.github.com) (`gh`), logged in
  (`gh auth login`) — used below to set repo secrets from the terminal. You
  can also set them from **Settings → Secrets and variables → Actions** in
  the GitHub UI instead.
- Docker, to build the image once locally for the very first deploy.

Set a few shell variables to reuse throughout (adjust names/region/repo):

```bash
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
RESOURCE_GROUP=facility-header-builder-rg
LOCATION=westus2
ACR_NAME=facilityheaderbuilder   # must be globally unique, letters/numbers only
CONTAINER_APP_ENV=facility-header-builder-env
CONTAINER_APP_NAME=facility-header-builder
GITHUB_REPO=SethSterling22/Facility_Header_Builder
```

## 1. Create a resource group

```bash
az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
```

## 2. Register the resource providers

A fresh Azure subscription doesn't have every resource provider enabled, and
each `az ... create` below fails with `MissingSubscriptionRegistration` until
its provider is registered. Register all three up front — registration is
per-subscription and only ever needs doing once:

```bash
az provider register --namespace Microsoft.ContainerRegistry --wait && az provider register --namespace Microsoft.App --wait && az provider register --namespace Microsoft.OperationalInsights --wait
```

`Microsoft.ContainerRegistry` is for the registry, `Microsoft.App` for
Container Apps, and `Microsoft.OperationalInsights` for the Log Analytics
workspace a Container Apps environment creates behind the scenes.

Confirm all three report `Registered` before continuing:

```bash
for ns in Microsoft.ContainerRegistry Microsoft.App Microsoft.OperationalInsights; do echo "$ns: $(az provider show -n $ns --query registrationState -o tsv)"; done
```

## 3. Create the Azure Container Registry (ACR)

```bash
az acr create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$ACR_NAME" \
  --sku Basic \
  --admin-enabled true
```

`--admin-enabled true` turns on the registry's built-in admin account, which
is the simplest way to get a username/password pair for
`docker/login-action` in the workflow. (For a hardened setup later, swap this
for a service principal scoped to `AcrPush`/`AcrPull` instead — not necessary
to get started.)

Grab the values the workflow needs:

```bash
ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --query loginServer -o tsv)
ACR_USERNAME=$(az acr credential show --name "$ACR_NAME" --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" -o tsv)
echo "$ACR_LOGIN_SERVER"
```

## 4. Build and push the image once, manually

The Container App needs a real image to point at when it's first created.
From the repo root:

```bash
az acr login --name "$ACR_NAME"
docker build -t "$ACR_LOGIN_SERVER/facility-header-builder:initial" .
docker push "$ACR_LOGIN_SERVER/facility-header-builder:initial"
```

## 5. Create the Container Apps environment and the app

```bash
az extension add --name containerapp --upgrade

az containerapp env create \
  --name "$CONTAINER_APP_ENV" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION"

az containerapp create \
  --name "$CONTAINER_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --environment "$CONTAINER_APP_ENV" \
  --image "$ACR_LOGIN_SERVER/facility-header-builder:initial" \
  --registry-server "$ACR_LOGIN_SERVER" \
  --registry-username "$ACR_USERNAME" \
  --registry-password "$ACR_PASSWORD" \
  --target-port 8080 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 2
```

`--ingress external` gives it a public HTTPS URL — print it with:

```bash
az containerapp show --name "$CONTAINER_APP_NAME" --resource-group "$RESOURCE_GROUP" \
  --query properties.configuration.ingress.fqdn -o tsv
```

## 6. Create a service principal for GitHub Actions

This is what lets `azure/login` in the workflow authenticate as your Azure
account, scoped to just this resource group:

```bash
az ad sp create-for-rbac \
  --name "facility-header-builder-gha" \
  --role Contributor \
  --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP" \
  --json-auth
```

That prints a JSON blob like:

```json
{
  "clientId": "...",
  "clientSecret": "...",
  "subscriptionId": "...",
  "tenantId": "..."
}
```

Copy the whole JSON output — that's the value for the `AZURE_CREDENTIALS`
secret below. (If your `az` version doesn't support `--json-auth`, run the
same command without that flag and assemble the JSON yourself from the
`appId`/`password`/`tenant` fields it prints, plus `$SUBSCRIPTION_ID`.)

## 7. Configure the GitHub repository secrets

```bash
gh secret set ACR_LOGIN_SERVER --repo "$GITHUB_REPO" --body "$ACR_LOGIN_SERVER"
gh secret set ACR_USERNAME --repo "$GITHUB_REPO" --body "$ACR_USERNAME"
gh secret set ACR_PASSWORD --repo "$GITHUB_REPO" --body "$ACR_PASSWORD"
gh secret set ACR_NAME --repo "$GITHUB_REPO" --body "$ACR_NAME"
gh secret set CONTAINER_APP_NAME --repo "$GITHUB_REPO" --body "$CONTAINER_APP_NAME"
gh secret set AZURE_RESOURCE_GROUP --repo "$GITHUB_REPO" --body "$RESOURCE_GROUP"

# Paste the JSON blob from step 6 when prompted, or pipe it in directly:
gh secret set AZURE_CREDENTIALS --repo "$GITHUB_REPO" --body '<paste the JSON from step 6>'
```

Verify they're all there:

```bash
gh secret list --repo "$GITHUB_REPO"
```

You should see all seven: `ACR_LOGIN_SERVER`, `ACR_USERNAME`, `ACR_PASSWORD`,
`ACR_NAME`, `AZURE_CREDENTIALS`, `CONTAINER_APP_NAME`, `AZURE_RESOURCE_GROUP`.

## 8. Trigger the workflow

Push to `main` (or re-run the last failed workflow run from the **Actions**
tab). It will build the image, push it to ACR tagged `latest` and with the
commit SHA, then update the Container App to that SHA-tagged image.

```bash
gh run list --repo "$GITHUB_REPO" --workflow deploy.yml --limit 3
gh run watch --repo "$GITHUB_REPO"
```

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `MissingSubscriptionRegistration` on any `az ... create` | The resource provider for that service isn't registered on the subscription — see step 2. The namespace it names in the error is the one to register. |
| `Error: Username and password required` on the ACR login step | `ACR_USERNAME`/`ACR_PASSWORD` secrets aren't set, or the registry's admin account is disabled (`--admin-enabled true` above). |
| `azure/login` fails with an auth error | `AZURE_CREDENTIALS` isn't valid JSON, or the service principal's scope doesn't include the resource group the Container App lives in. |
| `container-apps-deploy-action` can't find the Container App | `CONTAINER_APP_NAME` / `AZURE_RESOURCE_GROUP` secrets don't match what you created above, or the service principal's role assignment doesn't cover that resource group. |
| Deploy succeeds but the site 404s on `/builder` | Check `nginx.conf` shipped correctly in the image — `try_files $uri $uri.html $uri/ =404;` should resolve `/builder` to `/builder.html` from the static export. |
