resource "aws_secretsmanager_secret" "app" {
  for_each = toset(var.secret_names)

  name                    = "${var.name_prefix}/${each.key}"
  recovery_window_in_days = 7

  tags = {
    Name = "${var.name_prefix}-${each.key}"
  }
}
