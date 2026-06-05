import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { MockPreviewBanner } from "../components/MockPreviewBanner";
import { avipApiBaseUrl } from "../lib/avip-api.server";
import { shopifyReauthInstallUrl } from "../lib/reauth-url.server";
import { syncAvipShopFromAdmin } from "../lib/sync-avip-shop.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { shop, grantedScopes, missingScopes } =
    await syncAvipShopFromAdmin(request);
  return {
    shop,
    grantedScopes,
    missingScopes,
    avipApiUrl: avipApiBaseUrl(),
    reauthInstallUrl: shopifyReauthInstallUrl(shop),
    reauthorizePath: "/app/reauthorize",
  };
};

export default function SettingsPage() {
  const {
    shop,
    grantedScopes,
    missingScopes,
    avipApiUrl,
    reauthInstallUrl,
    reauthorizePath,
  } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Settings">
      <s-section heading="Store connection (live)">
        <s-paragraph>
          Connected store: <s-text type="strong">{shop}</s-text>
        </s-paragraph>
        <s-paragraph color="subdued">
          Granted scopes: {grantedScopes || "—"}
        </s-paragraph>
        {missingScopes.length > 0 && (
          <s-banner tone="warning">
            <s-paragraph>Missing: {missingScopes.join(", ")}</s-paragraph>
            <s-stack direction="inline" gap="base">
              <a href={reauthorizePath} target="_top" rel="noopener noreferrer">
                <s-button>Re-authorize</s-button>
              </a>
              <a href={reauthInstallUrl} target="_top" rel="noopener noreferrer">
                <s-button variant="secondary">Open install</s-button>
              </a>
            </s-stack>
          </s-banner>
        )}
      </s-section>

      <s-section heading="Backend (live)">
        <s-paragraph>
          API: <s-text type="strong">{avipApiUrl}</s-text>
        </s-paragraph>
        <s-paragraph color="subdued">
          Webhook: {avipApiUrl}/webhooks/fulfillment-error
        </s-paragraph>
      </s-section>

      <s-section heading="Preferences (preview)">
        <MockPreviewBanner message="These controls are layout-only — values are not saved yet." />
        <s-select label="Default recovery language" name="defaultLang">
          <s-option value="hi-IN">Hindi (India)</s-option>
          <s-option value="en-IN">English (India)</s-option>
        </s-select>
        <s-checkbox label="Auto-start recovery on webhook" name="autoWebhook" checked />
        <s-checkbox label="Send escalation email to team" name="escEmail" checked />
        <s-button variant="primary">Save preferences</s-button>
      </s-section>

      <s-section slot="aside" heading="Danger zone (preview)">
        <s-paragraph color="subdued">
          Disconnect AVIP from this store or purge call history — requires
          confirmation in production.
        </s-paragraph>
        <s-button variant="secondary" tone="critical">
          Disconnect store
        </s-button>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
