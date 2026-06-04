#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOFU_DIR="$ROOT/deploy/opentofu/environments/staging"

aws sts get-caller-identity || { echo "Run: aws login" >&2; exit 1; }
if creds="$(aws configure export-credentials --format env 2>/dev/null)"; then
  eval "$creds"
fi

cd "$TOFU_DIR"
tofu init -input=false
tofu apply -auto-approve
echo ""
tofu output public_ip
tofu output app_url
tofu output avip_backend_url
