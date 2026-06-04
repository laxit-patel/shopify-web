import { useEffect } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  avipApiBaseUrl,
  listAvipCalls,
  triggerRecoveryCall,
  triggerSimulateRto,
  type AvipCallRow,
} from "../lib/avip-api.server";
import { shopifyReauthInstallUrl } from "../lib/reauth-url.server";
import { fetchRecentOrders, type ShopifyOrderRow } from "../lib/shopify-orders.server";
import { syncAvipShopFromAdmin } from "../lib/sync-avip-shop.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { shop, grantedScopes, missingScopes, admin } =
    await syncAvipShopFromAdmin(request);

  let orders: ShopifyOrderRow[] = [];
  let ordersError: string | undefined;
  try {
    orders = await fetchRecentOrders(admin, 20);
  } catch (err) {
    ordersError =
      err instanceof Error ? err.message : "Could not load orders from Shopify";
  }

  const calls = await listAvipCalls(shop, 25);
  const callByOrder = new Map<string, AvipCallRow>();
  for (const c of calls) {
    callByOrder.set(c.orderId, c);
  }

  return {
    shop,
    grantedScopes,
    avipApiUrl: avipApiBaseUrl(),
    missingScopes,
    reauthInstallUrl: shopifyReauthInstallUrl(shop),
    reauthorizePath: "/app/reauthorize",
    orders,
    ordersError,
    calls,
    callByOrder: Object.fromEntries(callByOrder),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
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
};

function callStatusLabel(status: string | undefined): string {
  if (!status) return "—";
  return status.replace(/_/g, " ");
}

export default function AvipHome() {
  const {
    shop,
    avipApiUrl,
    missingScopes,
    reauthInstallUrl,
    reauthorizePath,
    orders,
    ordersError,
    calls,
    callByOrder,
  } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";

  useEffect(() => {
    if (fetcher.data?.ok && fetcher.data.workflowId) {
      const sim = fetcher.data.simulation ? " (simulation)" : "";
      shopify.toast.show(`Workflow started: ${fetcher.data.workflowId}${sim}`);
    }
    if (fetcher.data?.ok === false && fetcher.data.error) {
      shopify.toast.show(fetcher.data.error, { isError: true });
    }
  }, [fetcher.data, shopify]);

  return (
    <s-page heading="AVIP">
      {missingScopes.length > 0 && (
        <s-banner tone="warning">
          <s-paragraph>
            Missing scopes:{" "}
            <s-text type="strong">{missingScopes.join(", ")}</s-text>
          </s-paragraph>
          <s-stack direction="inline" gap="base">
            <a href={reauthorizePath} target="_top" rel="noopener noreferrer">
              <s-button>Re-authorize app</s-button>
            </a>
            <a href={reauthInstallUrl} target="_top" rel="noopener noreferrer">
              <s-button variant="secondary">Open Shopify install</s-button>
            </a>
          </s-stack>
        </s-banner>
      )}

      <s-section heading="Recovery voice calls">
        <s-paragraph>
          When a fulfillment fails or is cancelled, AVIP calls the customer using
          the phone on the order. Webhooks hit{" "}
          <s-text type="generic">{avipApiUrl}/webhooks/fulfillment-error</s-text>{" "}
          (topic configurable on the API via SHOPIFY_WEBHOOK_TOPIC).
        </s-paragraph>
        <s-paragraph>
          Store: <s-text type="strong">{shop}</s-text>
        </s-paragraph>
      </s-section>

      <s-section heading="Recent orders">
        {ordersError ? (
          <s-banner tone="critical">
            <s-paragraph>{ordersError}</s-paragraph>
          </s-banner>
        ) : orders.length === 0 ? (
          <s-paragraph>
            No orders yet. Create a test order with your phone on the customer,
            then cancel or fail fulfillment to trigger a webhook, or use Start
            recovery below.
          </s-paragraph>
        ) : (
          <s-stack direction="block" gap="base">
            {orders.map((order) => {
              const call = callByOrder[order.id] as AvipCallRow | undefined;
              return (
                <s-box
                  key={order.id}
                  padding="base"
                  borderWidth="base"
                  borderRadius="base"
                >
                  <s-stack direction="block" gap="small">
                    <s-stack direction="inline" gap="base">
                      <s-text type="strong">{order.name}</s-text>
                      <s-text type="generic">#{order.id}</s-text>
                    </s-stack>
                    <s-paragraph>
                      Phone:{" "}
                      <s-text type="strong">
                        {order.phone || "— add phone on customer"}
                      </s-text>
                      {" · "}
                      Fulfillment: {order.fulfillmentStatus}
                      {call ? (
                        <>
                          {" · "}
                          Call: {callStatusLabel(call.status)}
                        </>
                      ) : null}
                    </s-paragraph>
                    <fetcher.Form method="post">
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="intent" value="recover" />
                      <s-stack direction="inline" gap="base">
                        <s-button
                          type="submit"
                          {...(isLoading ? { loading: true } : {})}
                        >
                          Start recovery call
                        </s-button>
                      </s-stack>
                    </fetcher.Form>
                  </s-stack>
                </s-box>
              );
            })}
          </s-stack>
        )}
      </s-section>

      <s-section slot="aside" heading="Recent activity">
        {calls.length === 0 ? (
          <s-paragraph>No recovery calls logged yet.</s-paragraph>
        ) : (
          <s-stack direction="block" gap="small">
            {calls.map((c) => (
              <s-paragraph key={`${c.orderId}-${c.updatedAt}`}>
                <s-text type="strong">#{c.orderId}</s-text> —{" "}
                {callStatusLabel(c.status)}
                {c.outcome ? ` (${c.outcome})` : ""}
              </s-paragraph>
            ))}
          </s-stack>
        )}
      </s-section>

      <s-section heading="Developer tools">
        <details>
          <summary>
            <s-text type="strong">Simulation (no PSTN)</s-text>
          </summary>
          <s-paragraph>
            Runs the workflow in simulation mode — agent without dialing the
            customer. Use for quick API/Temporal checks.
          </s-paragraph>
          <fetcher.Form method="post">
            <s-stack direction="block" gap="base">
              <label>
                <s-text>Shopify order ID</s-text>
                <input
                  name="orderId"
                  type="text"
                  placeholder="e.g. 7459256434787"
                  style={{
                    display: "block",
                    marginTop: "0.5rem",
                    padding: "0.5rem",
                    width: "100%",
                  }}
                />
              </label>
              <input type="hidden" name="intent" value="simulate" />
              <s-button
                type="submit"
                variant="secondary"
                {...(isLoading ? { loading: true } : {})}
              >
                Run simulation
              </s-button>
            </s-stack>
          </fetcher.Form>
        </details>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
