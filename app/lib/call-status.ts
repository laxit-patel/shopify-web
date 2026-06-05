export function callStatusLabel(status: string | undefined): string {
  if (!status) return "—";
  return status.replace(/_/g, " ");
}

export function callStatusTone(
  status: string | undefined,
): "success" | "warning" | "critical" | "info" | "auto" {
  if (!status) return "auto";
  if (status === "completed") return "success";
  if (status === "in_call" || status === "dispatching") return "info";
  if (status === "cancelled" || status === "escalated") return "warning";
  return "auto";
}
