/** Shopify OAuth install URL — requests all scopes from SCOPES env / shopify.app.toml */
export function shopifyReauthInstallUrl(shopDomain: string): string {
  const shop = shopDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const clientId = process.env.SHOPIFY_API_KEY?.trim();
  const scopes =
    process.env.SCOPES?.trim() ||
    "read_fulfillments,read_orders,write_fulfillments,write_orders";
  if (!clientId) {
    throw new Error("SHOPIFY_API_KEY is not set");
  }
  const params = new URLSearchParams({
    client_id: clientId,
    scope: scopes,
  });
  return `https://${shop}/admin/oauth/install?${params.toString()}`;
}
