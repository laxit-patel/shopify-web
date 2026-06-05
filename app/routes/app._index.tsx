import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  avipApiBaseUrl,
  listAvipCalls,
  type AvipCallRow,
} from "../lib/avip-api.server";
import { callStatusLabel, callStatusTone } from "../lib/call-status";
import { useWorkflowToast } from "../hooks/useWorkflowToast";
import { shopifyReauthInstallUrl } from "../lib/reauth-url.server";
import { handleOrderAction } from "../lib/order-actions.server";
import {
  fetchRecentOrders,
  type ShopifyOrderRow,
} from "../lib/shopify-orders.server";
import { syncAvipShopFromAdmin } from "../lib/sync-avip-shop.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { shop, missingScopes, admin } = await syncAvipShopFromAdmin(request);

  let orders: ShopifyOrderRow[] = [];
  let ordersError: string | undefined;
  try {
    orders = await fetchRecentOrders(admin, 20);
  } catch (err) {
    ordersError =
      err instanceof Error ? err.message : "Could not load orders from Shopify";
  }

  const calls = await listAvipCalls(shop, 25);
  const callByOrder: Record<string, AvipCallRow> = {};
  for (const c of calls) {
    callByOrder[c.orderId] = c;
  }

  return {
    shop,
    avipApiUrl: avipApiBaseUrl(),
    missingScopes,
    reauthInstallUrl: shopifyReauthInstallUrl(shop),
    reauthorizePath: "/app/reauthorize",
    orders,
    ordersError,
    calls,
    callByOrder,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  return handleOrderAction(request);
};

export default function Dashboard() {
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
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";

  useWorkflowToast(fetcher.data);

  const stats = {
    callsThisMonth: calls.length,
    recoveryRate: "34%",
    avgDuration: "2:41",
    openEscalations: 3,
  };

  const kpiPreview = stats.callsThisMonth === 0;

  return (
    <s-page heading="Dashboard">
      <s-banner tone="info">
        <s-paragraph>
          <s-text type="strong">Recent orders</s-text> and{" "}
          <s-text type="strong">Start recovery / Simulate</s-text> use live
          Shopify and AVIP data. KPI cards (except calls count) are placeholder
          numbers until analytics are wired.
        </s-paragraph>
      </s-banner>

      {missingScopes.length > 0 && (
        <s-banner tone="warning" heading="Finish setup">
          <s-paragraph>
            Missing scopes: {missingScopes.join(", ")}. Re-authorize to grant
            access.
          </s-paragraph>
          <s-stack direction="inline" gap="base">
            <a href={reauthorizePath} target="_top" rel="noopener noreferrer">
              <s-button>Re-authorize app</s-button>
            </a>
            <a href={reauthInstallUrl} target="_top" rel="noopener noreferrer">
              <s-button variant="secondary">Open install</s-button>
            </a>
          </s-stack>
        </s-banner>
      )}

      <s-section padding="base">
        <s-grid gridTemplateColumns="repeat(4, 1fr)" gap="base">
          <s-box padding="base" border="base" borderRadius="base" background="subdued">
            <s-text color="subdued">Calls this month</s-text>
            <s-heading>{String(stats.callsThisMonth)}</s-heading>
            <s-text tone="success">+12% vs last month</s-text>
          </s-box>
          <s-box padding="base" border="base" borderRadius="base" background="subdued">
            <s-text color="subdued">Recovery rate {kpiPreview ? "(preview)" : ""}</s-text>
            <s-heading>{stats.recoveryRate}</s-heading>
            <s-text color="subdued">orders saved</s-text>
          </s-box>
          <s-box padding="base" border="base" borderRadius="base" background="subdued">
            <s-text color="subdued">Avg call duration (preview)</s-text>
            <s-heading>{stats.avgDuration}</s-heading>
          </s-box>
          <s-box padding="base" border="base" borderRadius="base" background="subdued">
            <s-text color="subdued">Open escalations (preview)</s-text>
            <s-heading>{String(stats.openEscalations)}</s-heading>
          </s-box>
        </s-grid>
      </s-section>

      <s-section heading="Recent orders (live from Shopify)">
        <s-paragraph color="subdued">
          Store: {shop} · Webhook: {avipApiUrl}/webhooks/fulfillment-error
        </s-paragraph>

        {ordersError ? (
          <s-banner tone="critical">
            <s-paragraph>{ordersError}</s-paragraph>
          </s-banner>
        ) : orders.length === 0 ? (
          <s-paragraph>
            No orders yet. Create a test order with a phone on the shipping
            address, then cancel or fail fulfillment — or use Start recovery.
          </s-paragraph>
        ) : (
          <s-stack direction="block" gap="base">
            {orders.map((order) => {
              const call = callByOrder[order.id];
              return (
                <s-box
                  key={order.id}
                  padding="base"
                  border="base"
                  borderRadius="base"
                >
                  <s-stack direction="inline" gap="base" alignItems="center">
                    <s-text type="strong">{order.name}</s-text>
                    <s-text color="subdued">#{order.id}</s-text>
                    <s-badge tone={callStatusTone(call?.status)}>
                      {callStatusLabel(call?.status) || order.fulfillmentStatus}
                    </s-badge>
                  </s-stack>
                  <s-paragraph>
                    Phone: {order.phone || "— add on shipping address"} ·{" "}
                    {order.fulfillmentStatus}
                  </s-paragraph>
                  <s-stack direction="inline" gap="base">
                    <fetcher.Form method="post">
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="intent" value="recover" />
                      <s-button
                        type="submit"
                        variant="primary"
                        {...(isLoading ? { loading: true } : {})}
                      >
                        Start recovery
                      </s-button>
                    </fetcher.Form>
                    <fetcher.Form method="post">
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="intent" value="simulate" />
                      <s-button
                        type="submit"
                        variant="secondary"
                        {...(isLoading ? { loading: true } : {})}
                      >
                        Simulate
                      </s-button>
                    </fetcher.Form>
                  </s-stack>
                </s-box>
              );
            })}
          </s-stack>
        )}
      </s-section>

      <s-section slot="aside" heading="Live activity">
        {calls.length === 0 ? (
          <s-paragraph color="subdued">No recovery calls logged yet.</s-paragraph>
        ) : (
          <s-stack direction="block" gap="base">
            {calls.map((c) => (
              <s-box
                key={`${c.orderId}-${c.updatedAt}`}
                padding="base"
                border="base"
                borderRadius="base"
              >
                <s-stack direction="inline" gap="base" alignItems="center">
                  <s-text type="strong">#{c.orderId}</s-text>
                  <s-badge tone={callStatusTone(c.status)}>
                    {callStatusLabel(c.status)}
                  </s-badge>
                </s-stack>
                {c.outcome && (
                  <s-paragraph color="subdued">{c.outcome}</s-paragraph>
                )}
                {c.workflowId && (
                  <s-paragraph color="subdued">{c.workflowId}</s-paragraph>
                )}
              </s-box>
            ))}
          </s-stack>
        )}
      </s-section>

      <s-section heading="Developer tools">
        <s-paragraph color="subdued">
          Simulation mode (no PSTN) — for staging and API checks.
        </s-paragraph>
        <fetcher.Form method="post">
          <s-stack direction="block" gap="base">
            <s-text-field
              name="orderId"
              label="Shopify order ID"
              placeholder="e.g. 7459256434787"
            />
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
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
