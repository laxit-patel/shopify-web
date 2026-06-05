import type { HeadersFunction } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { MockPreviewBanner } from "../components/MockPreviewBanner";
import { MOCK_TEAM } from "../lib/mock-data";

export default function TeamPage() {
  return (
    <s-page heading="Team">
      <MockPreviewBanner message="Preview — Shopify staff already open this app. AVIP team is for escalation email/SMS contacts (optional)." />

      <s-section heading="Members">
        <s-stack direction="inline" gap="base">
          <s-button variant="primary">Invite member</s-button>
        </s-stack>
        <s-table>
          <s-table-header-row>
            <s-table-header listSlot="primary">Member</s-table-header>
            <s-table-header listSlot="labeled">Role</s-table-header>
            <s-table-header listSlot="labeled">Notifications</s-table-header>
          </s-table-header-row>
          <s-table-body>
            {MOCK_TEAM.map((m) => (
              <s-table-row key={m.email}>
                <s-table-cell>
                  <s-text type="strong">{m.name}</s-text>
                  <s-paragraph color="subdued">{m.email}</s-paragraph>
                </s-table-cell>
                <s-table-cell>{m.role}</s-table-cell>
                <s-table-cell>{m.alerts}</s-table-cell>
              </s-table-row>
            ))}
          </s-table-body>
        </s-table>
      </s-section>

      <s-section slot="aside" heading="Notification channels">
        <s-checkbox label="Email on escalation" name="emailEsc" checked />
        <s-checkbox label="Daily summary" name="daily" />
        <s-paragraph color="subdued">
          SMS and Slack — planned for a later release.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
