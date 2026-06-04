variable "name_prefix" {
  type = string
}

variable "subnet_id" {
  type = string
}

variable "security_group_ids" {
  type = list(string)
}

variable "instance_type" {
  type    = string
  default = "t4g.small"
}

variable "key_name" {
  type        = string
  description = "EC2 key pair name for SSH (optional)"
  default     = ""
}

variable "root_volume_gb" {
  type    = number
  default = 30
}

variable "secrets_manager_arns" {
  type        = list(string)
  description = "Secrets the instance role may read"
  default     = []
}

variable "public_base_url" {
  type        = string
  description = "HTTPS base URL when domain/Caddy is ready (e.g. https://staging-api.example.com)"
  default     = ""
}
