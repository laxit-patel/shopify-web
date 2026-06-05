import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { getAvipPrompt, saveAvipPrompt } from "../lib/avip-api.server";
import { syncAvipShopFromAdmin } from "../lib/sync-avip-shop.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { shop } = await syncAvipShopFromAdmin(request);
  const prompt = await getAvipPrompt(shop);
  return {
    systemPrompt:
      prompt?.systemPrompt ??
      "You are an RTO recovery agent. Speak clearly, ask why delivery failed, and confirm the reason briefly.",
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop } = await syncAvipShopFromAdmin(request);
  const form = await request.formData();
  const systemPrompt = String(form.get("systemPrompt") ?? "").trim();
  if (!systemPrompt) return { ok: false, error: "Prompt is required" };
  return saveAvipPrompt(shop, systemPrompt);
};

export default function VoicePage() {
  const { systemPrompt } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const busy = fetcher.state !== "idle";

  return (
    <s-page heading="Voice & prompts">
      <s-section heading="Recovery agent prompt">
        <fetcher.Form method="post">
          <s-text-area
            label="System instructions"
            name="systemPrompt"
            rows={6}
            value={systemPrompt}
          />
          <s-stack direction="inline" gap="base">
            <s-button
              type="submit"
              variant="primary"
              {...(busy ? { loading: true } : {})}
            >
              Save prompt
            </s-button>
          </s-stack>
        </fetcher.Form>
        {fetcher.data?.ok === false && fetcher.data.error ? (
          <s-banner tone="critical">
            <s-paragraph>{fetcher.data.error}</s-paragraph>
          </s-banner>
        ) : null}
        {fetcher.data?.ok ? (
          <s-banner tone="success">
            <s-paragraph>Prompt saved — applies to new recovery calls.</s-paragraph>
          </s-banner>
        ) : null}
      </s-section>

      <s-section slot="aside" heading="Voice settings (preview)">
        <s-select label="Default language" name="language">
          <s-option value="hi-IN">Hindi (India)</s-option>
          <s-option value="en-IN">English (India)</s-option>
          <s-option value="ta-IN">Tamil</s-option>
        </s-select>
        <s-paragraph color="subdued">
          Language preference is saved under Settings → Preferences when the beta
          API is deployed.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
