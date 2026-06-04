#!/bin/bash
set -euo pipefail
dnf update -y
dnf install -y docker git

setup_swap() {
  local swapfile=/swapfile
  local swap_mb=2048
  if swapon --show 2>/dev/null | grep -q "$swapfile"; then return 0; fi
  fallocate -l "$${swap_mb}M" "$swapfile" 2>/dev/null || dd if=/dev/zero of="$swapfile" bs=1M count="$${swap_mb}"
  chmod 600 "$swapfile"
  mkswap "$swapfile"
  swapon "$swapfile"
  grep -q "^$swapfile " /etc/fstab || echo "$swapfile none swap sw 0 0" >> /etc/fstab
}
setup_swap

install_compose() {
  if docker compose version >/dev/null 2>&1; then return 0; fi
  mkdir -p /usr/libexec/docker/cli-plugins
  curl -fsSL "https://github.com/docker/compose/releases/download/v2.32.4/docker-compose-linux-aarch64" \
    -o /usr/libexec/docker/cli-plugins/docker-compose
  chmod +x /usr/libexec/docker/cli-plugins/docker-compose
}
install_compose
systemctl enable --now docker
usermod -aG docker ec2-user
mkdir -p /opt/shopify-web
chown ec2-user:ec2-user /opt/shopify-web
echo "${name_prefix} ready" > /opt/shopify-web/BOOTSTRAP.txt
