export type UpsertShopResult = {
  ok?: boolean;
  id?: string;
  shopDomain?: string;
  error?: string;
};

/**
 * Sync Shopify offline token + scopes into AVIP Postgres via the Go API.
 */
export async function upsertShopInAvip(params: {
  shopDomain: string;
  accessToken: string;
  scopes: string;
}): Promise<UpsertShopResult> {
  const base = (process.env.AVIP_API_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  const secret = process.env.AVIP_INTERNAL_SIGNAL_SECRET?.trim();
  if (!secret) {
    return { error: "AVIP_INTERNAL_SIGNAL_SECRET not configured" };
  }

  const res = await fetch(`${base}/internal/shops/upsert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-avip-internal-secret": secret,
    },
    body: JSON.stringify({
      shopDomain: params.shopDomain,
      accessToken: params.accessToken,
      scopes: params.scopes,
    }),
  });

  const text = await res.text();
  let body: UpsertShopResult;
  try {
    body = JSON.parse(text) as UpsertShopResult;
  } catch {
    return { error: text.slice(0, 200) || `HTTP ${res.status}` };
  }
  if (!res.ok) {
    return { error: body.error ?? `HTTP ${res.status}` };
  }
  return body;
}
