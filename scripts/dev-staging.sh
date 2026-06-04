#!/usr/bin/env bash
# Run shopify-web locally (CLI tunnel) with AVIP API on staging EC2.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AVIP_ROOT="${AVIP_ROOT:-$(cd "$ROOT/../avip" 2>/dev/null && pwd || true)}"
STAGING_API="${AVIP_STAGING_API_URL:-https://3-111-61-150.sslip.io}"
ENV_FILE="${ROOT}/.env"

cd "$ROOT"

if [[ ! -f "$ENV_FILE" ]]; then
  if [[ -f "${ROOT}/.env.staging.example" ]]; then
    cp "${ROOT}/.env.staging.example" "$ENV_FILE"
    echo "Created .env from .env.staging.example — run: shopify app env pull"
  else
    cp "${ROOT}/.env.example" "$ENV_FILE"
    echo "Created .env from .env.example"
  fi
fi

set_env() {
  local key="$1" value="$2"
  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    echo "${key}=${value}" >> "$ENV_FILE"
  fi
}

set_env AVIP_API_URL "$STAGING_API"

if [[ -f "${AVIP_ROOT}/.env" ]]; then
  # shellcheck disable=SC1091
  secret="$(grep -E '^AVIP_INTERNAL_SIGNAL_SECRET=' "${AVIP_ROOT}/.env" | cut -d= -f2- | tr -d '\r' || true)"
  if [[ -n "$secret" ]]; then
    set_env AVIP_INTERNAL_SIGNAL_SECRET "$secret"
    echo "==> AVIP_INTERNAL_SIGNAL_SECRET from ${AVIP_ROOT}/.env"
  fi
fi

if ! grep -q '^AVIP_INTERNAL_SIGNAL_SECRET=.\+' "$ENV_FILE" 2>/dev/null; then
  echo "WARN: Set AVIP_INTERNAL_SIGNAL_SECRET in .env (same as EC2 .env.staging)" >&2
fi

echo "==> Backend: ${STAGING_API}"
echo "==> UI: shopify app dev (tunnel) — laptop only runs the embedded app"
echo ""

# Drop a lone "--" if pnpm forwarded it (pnpm dev:staging -- --store=…)
args=()
for a in "$@"; do
  [[ "$a" == "--" ]] && continue
  args+=("$a")
done
if [[ ${#args[@]} -eq 0 ]]; then
  args=(--store="${SHOPIFY_DEV_STORE:-avip-store-ioj9xku3.myshopify.com}")
fi

exec shopify app dev "${args[@]}"
