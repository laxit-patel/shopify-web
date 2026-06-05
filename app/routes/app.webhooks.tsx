import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { avipApiBaseUrl } from "../lib/avip-api.server";
import { MockPreviewBanner } from "../components/MockPreviewBanner";

export const loader = async (_args: LoaderFunctionArgs) => {
  return { avipApiUrl: avipApiBaseUrl() };
};

export default function WebhooksPage() {
  const { avipApiUrl } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Triggers & webhooks">
      <MockPreviewBanner message="Webhook URL is real. Topic selector and delivery log are preview UI." />

      <s-section heading="Automatic trigger">
        <s-paragraph>
          When Shopify sends this event, AVIP starts a recovery workflow for the
          order.
        </s-paragraph>
        <s-select label="Webhook topic" name="topic">
          <s-option value="fulfillment_orders/cancelled">
            fulfillment_orders/cancelled
          </s-option>
          <s-option value="fulfillment_orders/cancellation_request_submitted">
            fulfillment_orders/cancellation_request_submitted
          </s-option>
        </s-select>
        <s-box padding="base" border="base" borderRadius="base" background="subdued">
          <s-text type="strong">Endpoint (live)</s-text>
          <s-paragraph>{avipApiUrl}/webhooks/fulfillment-error</s-paragraph>
        </s-box>
        <s-stack direction="inline" gap="base">
          <s-badge tone="success">Registered on install</s-badge>
          <s-button variant="secondary">Re-register webhook</s-button>
        </s-stack>
      </s-section>

      <s-section heading="Recent deliveries (preview)">
        <s-table>
          <s-table-header-row>
            <s-table-header listSlot="primary">Event</s-table-header>
            <s-table-header listSlot="labeled">Order</s-table-header>
            <s-table-header listSlot="inline">Result</s-table-header>
            <s-table-header listSlot="labeled">Time</s-table-header>
          </s-table-header-row>
          <s-table-body>
            <s-table-row>
              <s-table-cell>fulfillment_orders/cancelled</s-table-cell>
              <s-table-cell>#1042</s-table-cell>
              <s-table-cell>
                <s-badge tone="success">200 · workflow started</s-badge>
              </s-table-cell>
              <s-table-cell>Today, 09:12</s-table-cell>
            </s-table-row>
            <s-table-row>
              <s-table-cell>fulfillment_orders/cancelled</s-table-cell>
              <s-table-cell>#1038</s-table-cell>
              <s-table-cell>
                <s-badge tone="success">200</s-badge>
              </s-table-cell>
              <s-table-cell>Yesterday</s-table-cell>
            </s-table-row>
          </s-table-body>
        </s-table>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
