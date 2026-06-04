export type SimulateRtoResult = {
  ok: boolean;
  workflowId?: string;
  simulation?: boolean;
  error?: string;
};

export async function triggerSimulateRto(
  orderId: string,
  shop?: string,
): Promise<SimulateRtoResult> {
  const base = (process.env.AVIP_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const params = new URLSearchParams({ orderId });
  if (shop) params.set('shop', shop);
  const url = `${base}/dev/simulate-rto?${params.toString()}`;

  try {
    const res = await fetch(url, { method: 'POST' });
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
    return { ok: false, error: err instanceof Error ? err.message : 'Request failed' };
  }
}

export function avipApiBaseUrl(): string {
  return (process.env.AVIP_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}
