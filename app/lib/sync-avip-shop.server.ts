import { upsertShopInAvip } from "./avip-shop.server";
import { authenticate } from "../shopify.server";

export const REQUIRED_READ_SCOPES = [
  "read_orders",
  "read_fulfillments",
] as const;

export function missingReadScopes(scopeCsv: string): string[] {
  const granted = new Set(
    scopeCsv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  return REQUIRED_READ_SCOPES.filter((s) => !granted.has(s));
}

/**
 * Sync offline token + *actual* granted scopes (from Shopify) into AVIP Postgres.
 * session.scope in sqlite is often stale (write-only) after scope upgrades.
 */
export async function syncAvipShopFromAdmin(request: Request) {
  const { session, scopes: scopesApi, admin } = await authenticate.admin(request);

  let grantedCsv = (session.scope ?? "").trim();
  try {
    const detail = await scopesApi.query();
    if (detail.granted.length > 0) {
      grantedCsv = detail.granted.join(",");
    }
  } catch (err) {
    console.warn("[syncAvipShop] scopes.query failed; using session.scope");
  }

  if (session.accessToken) {
    const synced = await upsertShopInAvip({
      shopDomain: session.shop,
      accessToken: session.accessToken,
      scopes: grantedCsv,
    });
    if (synced.error) {
      console.warn("[syncAvipShop] avip upsert failed:", synced.error);
    }
  }

  const missingScopes = missingReadScopes(grantedCsv);

  return {
    shop: session.shop,
    grantedScopes: grantedCsv,
    missingScopes,
    admin,
  };
}
