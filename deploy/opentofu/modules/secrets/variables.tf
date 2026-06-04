variable "name_prefix" {
  type = string
}

variable "secret_names" {
  type        = list(string)
  description = "Logical secret keys (values set outside OpenTofu)"
}
