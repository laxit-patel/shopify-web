import { useEffect } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { avipApiBaseUrl, triggerSimulateRto } from "../lib/avip-api.server";
import { shopifyReauthInstallUrl } from "../lib/reauth-url.server";
import { syncAvipShopFromAdmin } from "../lib/sync-avip-shop.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { shop, grantedScopes, missingScopes } =
    await syncAvipShopFromAdmin(request);

  return {
    shop,
    grantedScopes,
    avipApiUrl: avipApiBaseUrl(),
    missingScopes,
    reauthInstallUrl: shopifyReauthInstallUrl(shop),
    reauthorizePath: "/app/reauthorize",
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop } = await syncAvipShopFromAdmin(request);
  const form = await request.formData();
  const orderId = String(form.get("orderId") ?? "").trim();
  if (!orderId) {
    return { ok: false, error: "Order ID is required" };
  }
  return triggerSimulateRto(orderId, shop);
};

export default function AvipHome() {
  const { shop, avipApiUrl, missingScopes, reauthInstallUrl, reauthorizePath } =
    useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";

  useEffect(() => {
    if (fetcher.data?.ok && fetcher.data.workflowId) {
      shopify.toast.show(`Workflow started: ${fetcher.data.workflowId}`);
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
            This install is missing scopes:{" "}
            <s-text type="strong">{missingScopes.join(", ")}</s-text>. Order
            fetch will fail until you grant them.
          </s-paragraph>
          <s-paragraph>
            Use one of these (opens Shopify outside the iframe):
          </s-paragraph>
          <s-stack direction="inline" gap="base">
            <a href={reauthorizePath} target="_top" rel="noopener noreferrer">
              <s-button>Re-authorize app</s-button>
            </a>
            <a href={reauthInstallUrl} target="_top" rel="noopener noreferrer">
              <s-button variant="secondary">Open Shopify install</s-button>
            </a>
          </s-stack>
          <s-paragraph>
            Approve <s-text type="strong">read orders</s-text> and{" "}
            <s-text type="strong">read fulfillments</s-text>, then return to
            this dashboard. If nothing happens, uninstall Avip under{" "}
            <s-text type="strong">Settings → Apps</s-text> and install again.
          </s-paragraph>
        </s-banner>
      )}

      <s-section heading="Recovery voice calls for failed deliveries">
        <s-paragraph>
          Connected store: <s-text type="strong">{shop}</s-text>
        </s-paragraph>
        <s-paragraph>
          Backend API: <s-text type="strong">{avipApiUrl}</s-text> (set{" "}
          <s-text type="code">AVIP_API_URL</s-text> in <s-text type="code">.env</s-text>)
        </s-paragraph>
      </s-section>

      <s-section heading="Test call (simulation)">
        <s-paragraph>
          Starts a Temporal workflow via the AVIP API. No PSTN dial in simulation mode. Local
          backend: run api + worker. Staging backend: use{" "}
          <s-text type="code">pnpm dev:staging</s-text> (EC2 must be up).
        </s-paragraph>
        <fetcher.Form method="post">
          <s-stack direction="block" gap="base">
            <label>
              <s-text>Shopify order ID</s-text>
              <input
                name="orderId"
                type="text"
                placeholder="e.g. 7459256434797"
                style={{ display: "block", marginTop: "0.5rem", padding: "0.5rem", width: "100%" }}
              />
            </label>
            <s-button type="submit" {...(isLoading ? { loading: true } : {})}>
              Run simulation
            </s-button>
          </s-stack>
        </fetcher.Form>
      </s-section>

      <s-section slot="aside" heading="Stack">
        <s-unordered-list>
          <s-list-item>Embedded app: Shopify CLI + React Router</s-list-item>
          <s-list-item>Platform: Go API + Temporal worker</s-list-item>
          <s-list-item>Marketing: Go site (cmd/marketing)</s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
