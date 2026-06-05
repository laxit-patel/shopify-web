import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { MockPreviewBanner } from "../components/MockPreviewBanner";
import { listAvipCalls } from "../lib/avip-api.server";
import { callStatusLabel, callStatusTone } from "../lib/call-status";
import { MOCK_CALLS } from "../lib/mock-data";
import { syncAvipShopFromAdmin } from "../lib/sync-avip-shop.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { shop } = await syncAvipShopFromAdmin(request);
  const calls = await listAvipCalls(shop, 50);
  return { calls, usingPreview: calls.length === 0 };
};

export default function CallsPage() {
  const { calls, usingPreview } = useLoaderData<typeof loader>();
  const rows = usingPreview ? MOCK_CALLS : calls;

  return (
    <s-page heading="Calls">
      {usingPreview && (
        <MockPreviewBanner message="No live calls yet — showing sample rows. Start recovery from the dashboard to populate this table." />
      )}

      <s-section heading="All recovery calls">
        <s-stack direction="inline" gap="base">
          <s-text-field label="Search order" name="search" placeholder="#1042" />
          <s-select label="Status" name="statusFilter">
            <s-option value="">All</s-option>
            <s-option value="completed">Completed</s-option>
            <s-option value="in_call">In call</s-option>
            <s-option value="cancelled">Cancelled</s-option>
          </s-select>
        </s-stack>

        <s-table>
          <s-table-header-row>
            <s-table-header listSlot="primary">Order</s-table-header>
            <s-table-header listSlot="labeled">Phone</s-table-header>
            <s-table-header listSlot="inline">Status</s-table-header>
            <s-table-header listSlot="labeled">Outcome</s-table-header>
            <s-table-header listSlot="labeled">Duration</s-table-header>
            <s-table-header listSlot="labeled">Updated</s-table-header>
          </s-table-header-row>
          <s-table-body>
            {rows.map((c) => (
              <s-table-row key={`${c.orderId}-${c.updatedAt}`}>
                <s-table-cell>
                  {"orderName" in c && c.orderName ? c.orderName : `#${c.orderId}`}
                </s-table-cell>
                <s-table-cell>{"phone" in c ? (c.phone ?? "—") : "—"}</s-table-cell>
                <s-table-cell>
                  <s-badge tone={callStatusTone(c.status)}>
                    {callStatusLabel(c.status)}
                  </s-badge>
                </s-table-cell>
                <s-table-cell>{c.outcome ?? "—"}</s-table-cell>
                <s-table-cell>
                  {"duration" in c ? (c.duration ?? "—") : "—"}
                </s-table-cell>
                <s-table-cell>{c.updatedAt}</s-table-cell>
              </s-table-row>
            ))}
          </s-table-body>
        </s-table>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
