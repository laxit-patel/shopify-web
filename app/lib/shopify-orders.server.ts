export type ShopifyOrderRow = {
  id: string;
  name: string;
  phone: string;
  fulfillmentStatus: string;
  createdAt: string;
};

const ORDERS_QUERY = `#graphql
  query AvipRecentOrders($first: Int!) {
    orders(first: $first, sortKey: CREATED_AT, reverse: true) {
      nodes {
        legacyResourceId
        name
        createdAt
        displayFulfillmentStatus
        shippingAddress {
          phone
        }
        billingAddress {
          phone
        }
      }
    }
  }
`;

type AdminGraphQL = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
};

export async function fetchRecentOrders(
  admin: AdminGraphQL,
  first = 20,
): Promise<ShopifyOrderRow[]> {
  const res = await admin.graphql(ORDERS_QUERY, { variables: { first } });
  const json = (await res.json()) as {
    data?: {
      orders?: {
        nodes?: Array<{
          legacyResourceId: string;
          name: string;
          createdAt: string;
          displayFulfillmentStatus: string;
          shippingAddress?: { phone?: string } | null;
          billingAddress?: { phone?: string } | null;
        }>;
      };
    };
    errors?: { message: string }[];
  };

  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }

  const nodes = json.data?.orders?.nodes ?? [];
  return nodes.map((o) => ({
    id: o.legacyResourceId,
    name: o.name,
    phone: (o.shippingAddress?.phone ?? o.billingAddress?.phone ?? "").trim(),
    fulfillmentStatus: o.displayFulfillmentStatus ?? "—",
    createdAt: o.createdAt,
  }));
}
