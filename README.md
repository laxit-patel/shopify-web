# @avip/shopify-web

Embedded Shopify admin app (React Router + Shopify CLI). Merchant dashboard for AVIP: install via CLI, test simulation, later billing and call history.

## Prerequisites

- [Shopify CLI](https://shopify.dev/docs/api/shopify-cli): `npm install -g @shopify/cli@latest`
- Partner org + app (create/link via CLI below)
- AVIP backend: **local** (api + worker) or **staging EC2** (see below)

## First-time setup

```bash
shopify auth login
cd shopify-web

pnpm install
pnpm config:link          # shopify app config link
pnpm env:pull             # SHOPIFY_API_KEY / SECRET into .env
pnpm setup                # prisma sqlite sessions

cp .env.example .env      # if no .env yet
# Local API:
#   AVIP_API_URL=http://localhost:3000
#   AVIP_INTERNAL_SIGNAL_SECRET=<same as ../avip/.env>
```

## Develop UI locally → staging backend (recommended)

**Laptop:** embedded app only (Shopify CLI tunnel).  
**EC2:** api, worker, Temporal, Postgres (already deployed).

```bash
cd shopify-web

# Writes AVIP_API_URL + secret from ../avip/.env into .env
pnpm dev:staging -- --store=avip-store-ioj9xku3.myshopify.com
```

Or set manually (`cp .env.staging.example .env`) — **`AVIP_INTERNAL_SIGNAL_SECRET` must match** `/opt/avip/.env.staging` on EC2.

Press **`p`** in the CLI when **Ready** → open app in Admin → **Run simulation** hits staging `POST /dev/simulate-rto`.

| Variable | Staging value |
|----------|----------------|
| `AVIP_API_URL` | `https://3-111-61-150.sslip.io` |
| `AVIP_INTERNAL_SIGNAL_SECRET` | Same as EC2 `.env.staging` |

Override API host: `AVIP_STAGING_API_URL=https://… pnpm dev:staging`

## Develop everything locally

From `avip` repo: `make local-smoke` or `make dev-up` (api + worker).

```bash
cd shopify-web
pnpm dev -- --store=avip-store-ioj9xku3.myshopify.com
```

## Troubleshooting `shopify app dev`

**Validation errors** (`client_id`, `name`, `webhooks` required):

```bash
shopify app config link --client-id=398db28ab6e441e3731f7b195a6472b5 --reset
```

Do **not** use `shopify app dev --clean` unless you intend to reset the dev preview.

**Simulate fails against staging:** check EC2 health, `SIMULATION_MODE_ENABLED=true`, and secret match. Logs: `https://3-111-61-150.sslip.io/logs/`

**Upsert shop fails:** `AVIP_INTERNAL_SIGNAL_SECRET` mismatch or staging API down.

## Test recovery flow

1. Open the app in Shopify Admin (CLI output / press `p`).
2. Enter a real **order ID** from your dev store.
3. Click **Run simulation** → `POST {AVIP_API_URL}/dev/simulate-rto`.
4. Watch Temporal / logs on staging Dozzle when using `dev:staging`.

## Architecture

| Concern | This app | AVIP (Go, EC2) |
|--------|----------|----------------|
| OAuth / embedded UI | Shopify CLI + tunnel | — |
| Shop tokens in Postgres | `POST /internal/shops/upsert` | api |
| RTO / workflows | `POST /dev/simulate-rto` (dev/staging) | api + worker + Temporal |
| Marketing install | — | `{PUBLIC_API_URL}/oauth/shopify` |

Sessions: `prisma/dev.sqlite` (local). AVIP data: staging Postgres on EC2.

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Local API + CLI tunnel |
| `pnpm dev:staging` | **Staging API** + CLI tunnel |
| `pnpm config:link` | Link `shopify.app.toml` to Partners app |
| `pnpm env:pull` | Sync API keys into `.env` |
| `pnpm deploy` | Deploy app config to Partners |

## Marketing site

Public landing: `avip` marketing (`cmd/marketing`). Install via marketing `/install` or this embedded app.
