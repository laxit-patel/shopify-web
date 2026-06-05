import type { HeadersFunction } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { MockPreviewBanner } from "../components/MockPreviewBanner";
import { MOCK_ESCALATIONS } from "../lib/mock-data";

export default function EscalationsPage() {
  return (
    <s-page heading="Escalations">
      <MockPreviewBanner message="Preview — escalations from the voice agent will queue here for human follow-up." />

      <s-section heading="Open queue">
        <s-stack direction="block" gap="base">
          {MOCK_ESCALATIONS.filter((e) => e.status === "open").map((e) => (
            <s-box
              key={e.orderId}
              padding="base"
              border="base"
              borderRadius="base"
            >
              <s-stack direction="inline" gap="base" alignItems="center">
                <s-text type="strong">{e.orderName}</s-text>
                <s-badge tone="warning">Open</s-badge>
              </s-stack>
              <s-paragraph>{e.reason}</s-paragraph>
              <s-paragraph color="subdued">{e.when} · unassigned</s-paragraph>
              <s-button variant="primary">Assign to me</s-button>
            </s-box>
          ))}
        </s-stack>
      </s-section>

      <s-section heading="Resolved">
        {MOCK_ESCALATIONS.filter((e) => e.status === "resolved").map((e) => (
          <s-box
            key={e.orderId}
            padding="base"
            border="base"
            borderRadius="base"
          >
            <s-stack direction="inline" gap="base" alignItems="center">
              <s-text type="strong">{e.orderName}</s-text>
              <s-badge tone="success">Resolved</s-badge>
            </s-stack>
            <s-paragraph>{e.reason}</s-paragraph>
            <s-paragraph color="subdued">
              {e.when} · {e.assignee}
            </s-paragraph>
          </s-box>
        ))}
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
