import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  avipApiBaseUrl,
  getAvipPreferences,
  saveAvipPreferences,
} from "../lib/avip-api.server";
import { shopifyReauthInstallUrl } from "../lib/reauth-url.server";
import { syncAvipShopFromAdmin } from "../lib/sync-avip-shop.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { shop, grantedScopes, missingScopes } =
    await syncAvipShopFromAdmin(request);
  const preferences = await getAvipPreferences(shop);
  return {
    shop,
    grantedScopes,
    missingScopes,
    avipApiUrl: avipApiBaseUrl(),
    reauthInstallUrl: shopifyReauthInstallUrl(shop),
    reauthorizePath: "/app/reauthorize",
    preferences: preferences ?? {
      defaultLanguage: "hi-IN",
      autoWebhook: true,
      escalationEmailEnabled: true,
    },
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop } = await syncAvipShopFromAdmin(request);
  const form = await request.formData();
  const result = await saveAvipPreferences(shop, {
    defaultLanguage: String(form.get("defaultLanguage") ?? "hi-IN"),
    autoWebhook: form.get("autoWebhook") === "on",
    escalationEmailEnabled: form.get("escalationEmailEnabled") === "on",
  });
  return result;
};

export default function SettingsPage() {
  const {
    shop,
    grantedScopes,
    missingScopes,
    avipApiUrl,
    reauthInstallUrl,
    reauthorizePath,
    preferences,
  } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const busy = fetcher.state !== "idle";

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

      <s-section heading="Preferences">
        <fetcher.Form method="post">
          <s-select
            label="Default recovery language"
            name="defaultLanguage"
            value={preferences.defaultLanguage}
          >
            <s-option value="hi-IN">Hindi (India)</s-option>
            <s-option value="en-IN">English (India)</s-option>
          </s-select>
          <s-checkbox
            label="Auto-start recovery on webhook"
            name="autoWebhook"
            checked={preferences.autoWebhook || undefined}
          />
          <s-checkbox
            label="Send escalation email to team"
            name="escalationEmailEnabled"
            checked={preferences.escalationEmailEnabled || undefined}
          />
          <s-button
            type="submit"
            variant="primary"
            {...(busy ? { loading: true } : {})}
          >
            Save preferences
          </s-button>
        </fetcher.Form>
        {fetcher.data?.ok ? (
          <s-banner tone="success">
            <s-paragraph>Preferences saved.</s-paragraph>
          </s-banner>
        ) : null}
      </s-section>

      <s-section slot="aside" heading="Danger zone (preview)">
        <s-paragraph color="subdued">
          Disconnect AVIP from this store — requires confirmation in production.
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
