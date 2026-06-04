# shopify-web deploy

| Host | Repo | Path on EC2 |
|------|------|-------------|
| **Backend API** | avip | `/opt/avip` |
| **This app** | shopify-web | `/opt/shopify-web` |

## One-time infra

```bash
aws login
bash scripts/apply-staging-infra.sh
# note public_ip, app_url
```

## One-time host

```bash
bash scripts/bootstrap-staging-ec2.sh <shopify-elastic-ip>
# SSH: edit /opt/shopify-web/.env.staging (Partners keys + AVIP_INTERNAL_SIGNAL_SECRET)
```

Update **Shopify Partners** (or `shopify app deploy` from repo root):

| Field | Staging value |
|-------|----------------|
| App URL | `https://65-2-58-133.sslip.io` |
| Redirect URLs | `https://65-2-58-133.sslip.io/auth/callback`, `.../auth/exit-iframe` |

**Not** `/api/auth` — this app uses `authPathPrefix: /auth` (see `app/shopify.server.ts`).

## Every release

Push to `main` → GitHub Actions, or on EC2:

```bash
cd /opt/shopify-web
export STAGING_IP=<ip> STAGING_PUBLIC_HOST=<sslip-host>
bash scripts/deploy-staging-remote.sh main
```

**Blank slate:** `BLANK_SLATE=1 bash scripts/deploy-staging-remote.sh main`

## GitHub secrets

| Secret | Value |
|--------|--------|
| `SHOPIFY_STAGING_HOST` | Shopify EC2 Elastic IP |
| `SHOPIFY_STAGING_PUBLIC_HOST` | e.g. `3-111-61-150.sslip.io` (shopify host sslip) |
| `STAGING_SSH_KEY` | Same PEM as avip (`avip-staging`) |
| `STAGING_CADDY_ACME_EMAIL` | Optional |

## Local dev (until shopify EC2 is live)

```bash
pnpm dev:staging
```
