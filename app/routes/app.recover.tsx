import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  getAvipPreferences,
  getAvipPrompt,
  triggerCustomRecovery,
} from "../lib/avip-api.server";
import { useWorkflowToast } from "../hooks/useWorkflowToast";
import {
  fetchRecentOrders,
  lookupOrderByNameOrId,
  type ShopifyOrderRow,
} from "../lib/shopify-orders.server";
import { syncAvipShopFromAdmin } from "../lib/sync-avip-shop.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { shop, admin } = await syncAvipShopFromAdmin(request);

  let orders: ShopifyOrderRow[] = [];
  let ordersError: string | undefined;
  try {
    orders = await fetchRecentOrders(admin, 15);
  } catch (err) {
    ordersError =
      err instanceof Error ? err.message : "Could not load orders from Shopify";
  }

  const [preferences, prompt] = await Promise.all([
    getAvipPreferences(shop),
    getAvipPrompt(shop),
  ]);

  return {
    shop,
    orders,
    ordersError,
    defaultLanguage: preferences?.defaultLanguage ?? "hi-IN",
    defaultPrompt:
      prompt?.systemPrompt ??
      "You are an RTO recovery agent. Speak clearly, ask why delivery failed, and confirm the reason briefly.",
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, admin } = await syncAvipShopFromAdmin(request);
  const form = await request.formData();

  const orderRef = String(form.get("orderRef") ?? "").trim();
  const orderIdField = String(form.get("orderId") ?? "").trim();
  const objective = String(form.get("objective") ?? "get_reason").trim();
  const language = String(form.get("language") ?? "hi-IN").trim();
  const systemPrompt = String(form.get("systemPrompt") ?? "").trim();
  const customerPhone = String(form.get("customerPhone") ?? "").trim();
  const simulation = form.get("simulation") === "on";

  let orderId = orderIdField;
  if (!orderId && orderRef) {
    const found = await lookupOrderByNameOrId(admin, orderRef);
    if (!found) {
      return { ok: false, error: `Order not found: ${orderRef}` };
    }
    orderId = found.id;
  }

  if (!orderId) {
    return { ok: false, error: "Select an order or enter order name / ID" };
  }

  return triggerCustomRecovery(shop, {
    orderId,
    objective,
    language,
    systemPrompt: systemPrompt || undefined,
    customerPhone: customerPhone || undefined,
    simulation,
  });
};

export default function RecoverPage() {
  const { orders, ordersError, defaultLanguage, defaultPrompt } =
    useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const busy = fetcher.state !== "idle";

  useWorkflowToast(fetcher.data);

  return (
    <s-page heading="Custom recovery">
      <s-section heading="Start a tailored recovery call">
        <s-paragraph color="subdued">
          Pick an order, set the call objective and language, optionally override
          the prompt or dial number for staging tests.
        </s-paragraph>

        {ordersError ? (
          <s-banner tone="critical">
            <s-paragraph>{ordersError}</s-paragraph>
          </s-banner>
        ) : null}

        <fetcher.Form method="post">
          <s-stack direction="block" gap="base">
            {orders.length > 0 ? (
              <s-select label="Recent order" name="orderId">
                <s-option value="">— or type below —</s-option>
                {orders.map((o) => (
                  <s-option key={o.id} value={o.id}>
                    {o.name} · #{o.id} · {o.phone || "no phone"}
                  </s-option>
                ))}
              </s-select>
            ) : null}

            <s-text-field
              name="orderRef"
              label="Order name or ID"
              placeholder="#1001 or 7459256434787"
              details="Used when no recent order is selected"
            />

            <s-select label="Objective" name="objective" value="get_reason">
              <s-option value="get_reason">Get failure reason</s-option>
              <s-option value="reschedule">Reschedule delivery</s-option>
              <s-option value="confirm_address">Confirm address</s-option>
              <s-option value="escalate_only">Escalate to human only</s-option>
            </s-select>

            <s-select
              label="Call language"
              name="language"
              value={defaultLanguage}
            >
              <s-option value="hi-IN">Hindi (India)</s-option>
              <s-option value="en-IN">English (India)</s-option>
              <s-option value="ta-IN">Tamil</s-option>
            </s-select>

            <s-text-area
              label="System prompt override (optional)"
              name="systemPrompt"
              rows={5}
              value={defaultPrompt}
              details="Leave as-is to use shop default with objective guidance appended"
            />

            <s-text-field
              name="customerPhone"
              label="Phone override (optional)"
              placeholder="+91…"
              details="Overrides Shopify shipping phone — useful for staging PSTN tests"
            />

            <s-checkbox name="simulation" label="Simulation mode (no PSTN dial)" />

            <s-button
              type="submit"
              variant="primary"
              {...(busy ? { loading: true } : {})}
            >
              Start custom recovery
            </s-button>
          </s-stack>
        </fetcher.Form>

        {fetcher.data?.ok === false && fetcher.data.error ? (
          <s-banner tone="critical">
            <s-paragraph>{fetcher.data.error}</s-paragraph>
          </s-banner>
        ) : null}
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
