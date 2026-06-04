locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

module "network" {
  source = "../../modules/network"

  name_prefix              = local.name_prefix
  ssh_allowed_cidr         = var.ssh_allowed_cidr
  ssh_allowed_cidrs        = var.ssh_allowed_cidrs
  ssh_allow_github_actions = var.ssh_allow_github_actions
}

module "ec2_app" {
  source = "../../modules/ec2-app"

  name_prefix          = local.name_prefix
  subnet_id            = module.network.public_subnet_id
  security_group_ids   = [module.network.app_security_group_id]
  instance_type        = var.instance_type
  key_name             = var.key_name
  secrets_manager_arns = []
}
