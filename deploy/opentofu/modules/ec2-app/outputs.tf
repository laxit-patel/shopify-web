output "instance_id" {
  value = aws_instance.app.id
}

output "public_ip" {
  value = aws_eip.app.public_ip
}

output "api_url" {
  description = "Base URL until HTTPS/domain is configured (Shopify needs HTTPS in prod)"
  value       = var.public_base_url != "" ? var.public_base_url : "http://${aws_eip.app.public_ip}"
}
