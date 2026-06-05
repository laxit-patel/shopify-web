import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  listAvipEscalations,
  resolveAvipEscalation,
  type AvipEscalationRow,
} from "../lib/avip-api.server";
import { syncAvipShopFromAdmin } from "../lib/sync-avip-shop.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { shop } = await syncAvipShopFromAdmin(request);
  const escalations = await listAvipEscalations(shop);
  return { escalations };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop } = await syncAvipShopFromAdmin(request);
  const form = await request.formData();
  const id = String(form.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "Missing escalation id" };
  return resolveAvipEscalation(shop, id);
};

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 86_400_000) return "Today";
    if (diff < 172_800_000) return "Yesterday";
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}

export default function EscalationsPage() {
  const { escalations } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const open = escalations.filter((e) => e.status === "open");
  const resolved = escalations.filter((e) => e.status !== "open");

  return (
    <s-page heading="Escalations">
      {escalations.length === 0 ? (
        <s-banner tone="info">
          <s-paragraph>
            No escalations yet. They appear when the voice agent hands off to a
            human.
          </s-paragraph>
        </s-banner>
      ) : null}

      <s-section heading="Open queue">
        {open.length === 0 ? (
          <s-paragraph color="subdued">No open escalations.</s-paragraph>
        ) : (
          <s-stack direction="block" gap="base">
            {open.map((e) => (
              <EscalationCard key={e.id} row={e} fetcher={fetcher} />
            ))}
          </s-stack>
        )}
      </s-section>

      <s-section heading="Resolved">
        {resolved.length === 0 ? (
          <s-paragraph color="subdued">None resolved yet.</s-paragraph>
        ) : (
          resolved.map((e) => (
            <s-box
              key={e.id}
              padding="base"
              border="base"
              borderRadius="base"
            >
              <s-stack direction="inline" gap="base" alignItems="center">
                <s-text type="strong">#{e.orderId}</s-text>
                <s-badge tone="success">Resolved</s-badge>
              </s-stack>
              <s-paragraph>{e.reason ?? "—"}</s-paragraph>
              <s-paragraph color="subdued">
                {formatWhen(e.updatedAt)} · {e.assignee ?? "—"}
              </s-paragraph>
            </s-box>
          ))
        )}
      </s-section>
    </s-page>
  );
}

function EscalationCard({
  row,
  fetcher,
}: {
  row: AvipEscalationRow;
  fetcher: ReturnType<typeof useFetcher<typeof action>>;
}) {
  const busy = fetcher.state !== "idle" && fetcher.formData?.get("id") === row.id;
  return (
    <s-box padding="base" border="base" borderRadius="base">
      <s-stack direction="inline" gap="base" alignItems="center">
        <s-text type="strong">#{row.orderId}</s-text>
        <s-badge tone="warning">Open</s-badge>
      </s-stack>
      <s-paragraph>{row.reason ?? "—"}</s-paragraph>
      <s-paragraph color="subdued">{formatWhen(row.createdAt)} · unassigned</s-paragraph>
      <fetcher.Form method="post">
        <input type="hidden" name="id" value={row.id} />
        <s-button type="submit" variant="primary" {...(busy ? { loading: true } : {})}>
          Resolve
        </s-button>
      </fetcher.Form>
    </s-box>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
