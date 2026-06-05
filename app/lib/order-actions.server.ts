import { triggerRecoveryCall, triggerSimulateRto } from "./avip-api.server";
import { syncAvipShopFromAdmin } from "./sync-avip-shop.server";

export async function handleOrderAction(request: Request) {
  const { shop } = await syncAvipShopFromAdmin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  const orderId = String(form.get("orderId") ?? "").trim();

  if (!orderId) {
    return { ok: false, error: "Order ID is required" };
  }

  if (intent === "simulate") {
    return triggerSimulateRto(orderId, shop);
  }
  if (intent === "recover") {
    return triggerRecoveryCall(shop, orderId);
  }

  return { ok: false, error: "Unknown action" };
}
