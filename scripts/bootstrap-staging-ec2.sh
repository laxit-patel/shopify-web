#!/usr/bin/env bash
# One-time: clone repo on shopify EC2 and create .env.staging from example.
set -euo pipefail

HOST="${1:?Usage: bootstrap-staging-ec2.sh <elastic-ip>}"
REPO="${SHOPIFY_REPO:-git@github.com:laxit-patel/shopify-web.git}"
BRANCH="${SHOPIFY_BRANCH:-main}"
KEY="${STAGING_SSH_KEY:-$HOME/.ssh/avip-staging}"
USER="${STAGING_SSH_USER:-ec2-user}"

SSLIP="$(echo "$HOST" | tr '.' '-').sslip.io"

ssh -i "$KEY" -o StrictHostKeyChecking=no "${USER}@${HOST}" bash -s <<EOF
set -euo pipefail
sudo mkdir -p /opt/shopify-web
sudo chown ec2-user:ec2-user /opt/shopify-web
if [[ ! -d /opt/shopify-web/.git ]]; then
  git clone -b ${BRANCH} ${REPO} /opt/shopify-web
fi
cd /opt/shopify-web
if [[ ! -f .env.staging ]]; then
  cp .env.staging.example .env.staging
  sed -i "s|REPLACE-WITH-SSLIP-HOST|$(echo ${HOST} | tr '.' '-')|" .env.staging
  sed -i "s|^SHOPIFY_APP_URL=.*|SHOPIFY_APP_URL=https://${SSLIP}|" .env.staging
fi
echo "Edit /opt/shopify-web/.env.staging (SHOPIFY_API_KEY, secrets) then:"
echo "  export STAGING_IP=${HOST} STAGING_PUBLIC_HOST=${SSLIP}"
echo "  bash scripts/deploy-staging-remote.sh ${BRANCH}"
EOF
