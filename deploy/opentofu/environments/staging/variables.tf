variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "environment" {
  type    = string
  default = "staging"
}

variable "project_name" {
  type    = string
  default = "avip-shopify"
}

variable "instance_type" {
  type    = string
  default = "t4g.small"
}

variable "key_name" {
  type        = string
  description = "EC2 key pair (same as avip staging is fine)"
  default     = ""
}

variable "ssh_allowed_cidr" {
  type    = string
  default = ""
}

variable "ssh_allowed_cidrs" {
  type    = list(string)
  default = []
}

variable "ssh_allow_github_actions" {
  type    = bool
  default = true
}

variable "avip_backend_url" {
  type        = string
  description = "AVIP staging API (for .env.staging on host), e.g. https://3-111-61-150.sslip.io"
  default     = "https://3-111-61-150.sslip.io"
}
