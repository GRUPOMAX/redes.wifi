// src/lib/noco.ts
import { ensureArray, coerceWifi } from './wifi-types';
import type { WifiNetwork } from './wifi-types'; // ⬅️ type-only import

const BASE = import.meta.env.VITE_NOCODB_URL?.replace(/\/+$/, '') || '';
const TOKEN = import.meta.env.VITE_NOCODB_TOKEN || '';

export async function listWifi(): Promise<WifiNetwork[]> {
  if (!BASE) throw new Error('VITE_NOCODB_URL não configurado');

  const res = await fetch(`${BASE}/api/v2/tables/mk3n4tb1mr7y0y2/records?limit=1000`, {
    headers: { Accept: 'application/json', 'xc-token': TOKEN },
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = data?.message || data?.error?.message || text || `HTTP ${res.status}`;
    const err = new Error(`NocoDB ${res.status}: ${msg}`);
    // @ts-ignore
    err.details = { status: res.status, url: res.url, body: data ?? text };
    throw err;
  }

  const list = ensureArray<unknown>(data).map(coerceWifi).filter(Boolean) as WifiNetwork[];
  return list;
}
