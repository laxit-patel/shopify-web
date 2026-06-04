variable "name_prefix" {
  type = string
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "ssh_allowed_cidr" {
  type        = string
  description = "Deprecated: use ssh_allowed_cidrs. Single CIDR for SSH (e.g. your IP/32)."
  default     = ""
}

variable "ssh_allowed_cidrs" {
  type        = list(string)
  description = "Additional CIDRs allowed for SSH (e.g. your IP/32)."
  default     = []
}

variable "ssh_allow_github_actions" {
  type        = bool
  description = "Allow SSH from 0.0.0.0/0 so GitHub Actions can deploy (key-based auth). Staging only."
  default     = false
}
