export type SimulateRtoResult = {
  ok: boolean;
  workflowId?: string;
  simulation?: boolean;
  error?: string;
};

export type AvipCallRow = {
  orderId: string;
  status: string;
  outcome?: string;
  workflowId?: string;
  updatedAt: string;
};

function avipBase(): string {
  return (process.env.AVIP_API_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function avipSecret(): string | undefined {
  return process.env.AVIP_INTERNAL_SIGNAL_SECRET?.trim();
}

async function avipFetch(
  path: string,
  init?: RequestInit,
): Promise<{ res: Response; text: string }> {
  const secret = avipSecret();
  if (!secret) {
    return {
      res: new Response(null, { status: 500 }),
      text: "AVIP_INTERNAL_SIGNAL_SECRET not configured",
    };
  }
  const res = await fetch(`${avipBase()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-avip-internal-secret": secret,
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  return { res, text };
}

export async function triggerSimulateRto(
  orderId: string,
  shop?: string,
): Promise<SimulateRtoResult> {
  const params = new URLSearchParams({ orderId });
  if (shop) params.set("shop", shop);
  const url = `${avipBase()}/dev/simulate-rto?${params.toString()}`;

  try {
    const res = await fetch(url, { method: "POST" });
    const text = await res.text();
    let body: SimulateRtoResult & { error?: string };
    try {
      body = JSON.parse(text) as SimulateRtoResult & { error?: string };
    } catch {
      return { ok: false, error: text.slice(0, 200) || `HTTP ${res.status}` };
    }
    if (!res.ok) {
      return { ok: false, error: body.error ?? `HTTP ${res.status}` };
    }
    return body;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Request failed",
    };
  }
}

export async function triggerRecoveryCall(
  shopDomain: string,
  orderId: string,
): Promise<SimulateRtoResult> {
  const { res, text } = await avipFetch("/internal/calls/trigger", {
    method: "POST",
    body: JSON.stringify({
      shopDomain,
      orderId,
      simulation: false,
      source: "shopify-admin",
    }),
  });
  let body: SimulateRtoResult & { error?: string };
  try {
    body = JSON.parse(text) as SimulateRtoResult & { error?: string };
  } catch {
    return { ok: false, error: text.slice(0, 200) || `HTTP ${res.status}` };
  }
  if (!res.ok) {
    return { ok: false, error: body.error ?? `HTTP ${res.status}` };
  }
  return body;
}

export async function listAvipCalls(
  shopDomain: string,
  limit = 25,
): Promise<AvipCallRow[]> {
  const params = new URLSearchParams({ shopDomain, limit: String(limit) });
  const { res, text } = await avipFetch(`/internal/calls?${params.toString()}`);
  if (!res.ok) {
    console.warn("[listAvipCalls]", text.slice(0, 200));
    return [];
  }
  try {
    const body = JSON.parse(text) as { calls?: AvipCallRow[] };
    return body.calls ?? [];
  } catch {
    return [];
  }
}

export function avipApiBaseUrl(): string {
  return avipBase();
}
