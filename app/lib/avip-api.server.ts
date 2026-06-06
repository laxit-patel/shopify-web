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
  durationSeconds?: number;
  updatedAt: string;
};

export type AvipEscalationRow = {
  id: string;
  orderId: string;
  reason?: string;
  status: string;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
};

export type AvipPreferences = {
  defaultLanguage: string;
  autoWebhook: boolean;
  escalationEmailEnabled: boolean;
};

export type AvipPrompt = {
  systemPrompt: string;
  updatedAt?: string;
};

export type AvipAnalytics = {
  callsThisMonth: number;
  totalCalls: number;
  completedCalls: number;
  avgDurationSeconds: number;
  openEscalations: number;
  recoveryRate: string;
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

function shopQuery(shopDomain: string, path: string, extra?: URLSearchParams) {
  const params = new URLSearchParams({ shopDomain });
  if (extra) {
    for (const [k, v] of extra) params.set(k, v);
  }
  return `${path}?${params.toString()}`;
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

export type CustomRecoveryInput = {
  orderId: string;
  objective?: string;
  language?: string;
  systemPrompt?: string;
  customerPhone?: string;
  simulation?: boolean;
};

export async function triggerCustomRecovery(
  shopDomain: string,
  input: CustomRecoveryInput,
): Promise<SimulateRtoResult> {
  const { res, text } = await avipFetch("/internal/calls/trigger", {
    method: "POST",
    body: JSON.stringify({
      shopDomain,
      orderId: input.orderId,
      simulation: input.simulation ?? false,
      source: "custom-recovery",
      objective: input.objective || "get_reason",
      language: input.language,
      systemPrompt: input.systemPrompt,
      customerPhone: input.customerPhone,
      forceNew: true,
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
  const { res, text } = await avipFetch(
    shopQuery(shopDomain, "/internal/calls", new URLSearchParams({ limit: String(limit) })),
  );
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

export async function listAvipEscalations(
  shopDomain: string,
): Promise<AvipEscalationRow[]> {
  const { res, text } = await avipFetch(shopQuery(shopDomain, "/internal/escalations"));
  if (!res.ok) {
    console.warn("[listAvipEscalations]", text.slice(0, 200));
    return [];
  }
  try {
    const body = JSON.parse(text) as { escalations?: AvipEscalationRow[] };
    return body.escalations ?? [];
  } catch {
    return [];
  }
}

export async function resolveAvipEscalation(
  shopDomain: string,
  escalationId: string,
  assignee = "merchant",
): Promise<{ ok: boolean; error?: string }> {
  const { res, text } = await avipFetch(
    shopQuery(shopDomain, `/internal/escalations/${escalationId}/resolve`),
    {
      method: "POST",
      body: JSON.stringify({ assignee }),
    },
  );
  if (!res.ok) {
    return { ok: false, error: text.slice(0, 200) || `HTTP ${res.status}` };
  }
  return { ok: true };
}

export async function getAvipPreferences(
  shopDomain: string,
): Promise<AvipPreferences | null> {
  const { res, text } = await avipFetch(shopQuery(shopDomain, "/internal/preferences"));
  if (!res.ok) return null;
  try {
    const body = JSON.parse(text) as { preferences?: AvipPreferences };
    return body.preferences ?? null;
  } catch {
    return null;
  }
}

export async function saveAvipPreferences(
  shopDomain: string,
  prefs: AvipPreferences,
): Promise<{ ok: boolean; error?: string }> {
  const { res, text } = await avipFetch(shopQuery(shopDomain, "/internal/preferences"), {
    method: "PUT",
    body: JSON.stringify(prefs),
  });
  if (!res.ok) {
    return { ok: false, error: text.slice(0, 200) || `HTTP ${res.status}` };
  }
  return { ok: true };
}

export async function getAvipPrompt(shopDomain: string): Promise<AvipPrompt | null> {
  const { res, text } = await avipFetch(shopQuery(shopDomain, "/internal/prompt"));
  if (!res.ok) return null;
  try {
    const body = JSON.parse(text) as { prompt?: { systemPrompt: string }; updatedAt?: string };
    if (!body.prompt) return null;
    return { systemPrompt: body.prompt.systemPrompt, updatedAt: body.updatedAt };
  } catch {
    return null;
  }
}

export async function saveAvipPrompt(
  shopDomain: string,
  systemPrompt: string,
): Promise<{ ok: boolean; error?: string }> {
  const { res, text } = await avipFetch(shopQuery(shopDomain, "/internal/prompt"), {
    method: "PUT",
    body: JSON.stringify({ systemPrompt }),
  });
  if (!res.ok) {
    return { ok: false, error: text.slice(0, 200) || `HTTP ${res.status}` };
  }
  return { ok: true };
}

export async function getAvipAnalytics(
  shopDomain: string,
): Promise<AvipAnalytics | null> {
  const { res, text } = await avipFetch(shopQuery(shopDomain, "/internal/analytics"));
  if (!res.ok) return null;
  try {
    return JSON.parse(text) as AvipAnalytics;
  } catch {
    return null;
  }
}

export function avipApiBaseUrl(): string {
  return avipBase();
}

