import type { HeadersFunction } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { MockPreviewBanner } from "../components/MockPreviewBanner";

export default function VoicePage() {
  return (
    <s-page heading="Voice & prompts">
      <MockPreviewBanner message="Preview — prompt and voice settings will save to AVIP per shop (prompt_profiles)." />

      <s-section heading="Recovery agent prompt">
        <s-text-area
          label="System instructions"
          name="systemPrompt"
          rows={6}
          value="You are an RTO recovery agent for a Shopify store. Speak clearly in the customer's language. Confirm delivery address, ask why delivery failed, and offer to reschedule. Keep calls under 3 minutes."
        />
        <s-stack direction="inline" gap="base">
          <s-button variant="primary">Save prompt</s-button>
          <s-button variant="secondary">Reset to default</s-button>
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Voice settings">
        <s-select label="Default language" name="language">
          <s-option value="hi-IN">Hindi (India)</s-option>
          <s-option value="en-IN">English (India)</s-option>
          <s-option value="ta-IN">Tamil</s-option>
        </s-select>
        <s-number-field
          label="Max call duration (minutes)"
          name="maxDuration"
          value={30}
          min={5}
          max={60}
        />
        <s-switch label="Simulation mode (no PSTN)" name="simulation" />
        <s-paragraph color="subdued">
          When enabled, workflows run without dialing the customer — useful for
          staging.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
