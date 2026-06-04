#!/usr/bin/env bash
# Run on shopify staging EC2 (/opt/shopify-web).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
BRANCH="${1:-main}"
COMPOSE=(docker compose -f deploy/compose/staging-ec2.yml)

if [[ ! -f .env.staging ]]; then
  echo "Missing .env.staging — copy from .env.staging.example" >&2
  exit 1
fi

git_as_ec2() {
  if [[ "$(id -u)" -eq 0 ]]; then
    sudo -u ec2-user git -c safe.directory="$ROOT" "$@"
  else
    git -c safe.directory="$ROOT" "$@"
  fi
}

if ! swapon --show 2>/dev/null | grep -q /swapfile; then
  sudo bash "${ROOT}/deploy/staging/setup-swap.sh"
fi

if [[ ! -f deploy/ec2/caddy.env ]]; then
  ip="${STAGING_IP:-}"
  host="${STAGING_PUBLIC_HOST:-}"
  if [[ -z "$host" && -n "$ip" ]]; then
    host="$(echo "$ip" | tr '.' '-').sslip.io"
  fi
  cp deploy/ec2/caddy.env.example deploy/ec2/caddy.env
  [[ -n "$ip" ]] && sed -i "s/^STAGING_IP=.*/STAGING_IP=${ip}/" deploy/ec2/caddy.env
  [[ -n "$host" ]] && sed -i "s|^STAGING_PUBLIC_HOST=.*|STAGING_PUBLIC_HOST=${host}|" deploy/ec2/caddy.env
  sed -i "s/^CADDY_ACME_EMAIL=.*/CADDY_ACME_EMAIL=${CADDY_ACME_EMAIL:-admin@vedanova.com}/" deploy/ec2/caddy.env
fi

echo "==> Deploy origin/${BRANCH}"
git_as_ec2 fetch origin
git_as_ec2 reset --hard "origin/${BRANCH}"

if [[ "${BLANK_SLATE:-}" == "1" ]]; then
  "${COMPOSE[@]}" down --remove-orphans || true
fi

export COMPOSE_PARALLEL_LIMIT="${COMPOSE_PARALLEL_LIMIT:-1}"
"${COMPOSE[@]}" up -d --build

echo "==> Smoke"
"${COMPOSE[@]}" exec -T shopify wget -qO- http://127.0.0.1:3000/ 2>/dev/null | head -c 80 || true
echo ""
"${COMPOSE[@]}" ps --format 'table {{.Service}}\t{{.Status}}'
