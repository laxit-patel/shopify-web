import type { HeadersFunction } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { MockPreviewBanner } from "../components/MockPreviewBanner";

export default function BillingPage() {
  return (
    <s-page heading="Plan & billing">
      <MockPreviewBanner message="Preview — billing will use Shopify Billing API or Stripe in production." />

      <s-section heading="Current plan">
        <s-box padding="base" border="base" borderRadius="base" background="subdued">
          <s-heading>Growth</s-heading>
          <s-paragraph>₹4,999 / month · 2,000 recovery calls</s-paragraph>
          <s-paragraph color="subdued">847 of 2,000 calls used this period</s-paragraph>
        </s-box>
        <s-stack direction="inline" gap="base">
          <s-button variant="primary">Upgrade plan</s-button>
          <s-button variant="secondary">Manage payment</s-button>
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Usage (preview)">
        <s-box padding="base" border="base" borderRadius="base">
          <s-text color="subdued">PSTN minutes</s-text>
          <s-heading>1,204</s-heading>
        </s-box>
        <s-box padding="base" border="base" borderRadius="base">
          <s-text color="subdued">Simulations</s-text>
          <s-heading>56</s-heading>
        </s-box>
        <s-box padding="base" border="base" borderRadius="base">
          <s-text color="subdued">Overage</s-text>
          <s-heading>₹0</s-heading>
        </s-box>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
