output "public_ip" {
  description = "Elastic IP — set SHOPIFY_APP_URL / Partners app URL after deploy"
  value       = module.ec2_app.public_ip
}

output "sslip_host" {
  description = "sslip.io hostname (dots → dashes)"
  value       = "${replace(module.ec2_app.public_ip, ".", "-")}.sslip.io"
}

output "app_url" {
  description = "HTTPS app URL (after Caddy + first deploy)"
  value       = "https://${replace(module.ec2_app.public_ip, ".", "-")}.sslip.io"
}

output "avip_backend_url" {
  value = var.avip_backend_url
}

output "instance_id" {
  value = module.ec2_app.instance_id
}
