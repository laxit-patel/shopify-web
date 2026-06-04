#!/usr/bin/env bash
set -euo pipefail
export BLANK_SLATE=1
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ "${RESET_VOLUMES:-}" == "1" ]]; then
  docker compose -f "${ROOT}/deploy/compose/staging-ec2.yml" down -v --remove-orphans || true
fi
exec bash "${ROOT}/scripts/deploy-staging-remote.sh" "${1:-main}"
