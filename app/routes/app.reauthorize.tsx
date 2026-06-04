import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import db from "../db.server";
import { shopifyReauthInstallUrl } from "../lib/reauth-url.server";
import { authenticate } from "../shopify.server";

/**
 * Clears the local session and sends the merchant to Shopify's install/OAuth screen
 * so a new offline token is issued with the full scope list.
 * Open via target="_top" from the embedded dashboard.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  await db.session.deleteMany({ where: { shop: session.shop } });
  return redirect(shopifyReauthInstallUrl(session.shop));
};
