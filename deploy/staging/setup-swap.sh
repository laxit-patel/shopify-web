#!/usr/bin/env bash
# Idempotent 2 GB swap on Amazon Linux 2023 (staging EC2). Run as root or via sudo.
set -euo pipefail

SWAPFILE="${SWAPFILE:-/swapfile}"
SWAP_MB="${SWAP_MB:-2048}"

if swapon --show 2>/dev/null | grep -q "${SWAPFILE}"; then
  echo "Swap already active: ${SWAPFILE}"
  swapon --show
  exit 0
fi

echo "==> Creating ${SWAP_MB}MB swap at ${SWAPFILE}"
if ! fallocate -l "${SWAP_MB}M" "${SWAPFILE}" 2>/dev/null; then
  dd if=/dev/zero of="${SWAPFILE}" bs=1M count="${SWAP_MB}" status=progress
fi
chmod 600 "${SWAPFILE}"
mkswap "${SWAPFILE}"
swapon "${SWAPFILE}"
if ! grep -q "^${SWAPFILE} " /etc/fstab; then
  echo "${SWAPFILE} none swap sw 0 0" >> /etc/fstab
fi

echo "==> Done"
free -h
swapon --show
