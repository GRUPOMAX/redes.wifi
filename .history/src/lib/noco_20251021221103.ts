// src/lib/noco.ts
import { ensureArray, coerceWifi } from './wifi-types';
import type { WifiNetwork } from './wifi-types'; // ⬅️ type-only import

const BASE = import.meta.env.VITE_NOCODB_URL?.replace(/\/+$/, '') || '';
const TOKEN = import.meta.env.VITE_NOCODB_TOKEN || '';
// ID fixo da tabela (mantendo o seu atual)
const TABLE_ID = 'mk3n4tb1mr7y0y2';

// -------------------- Utils internos --------------------
async function parseJsonSafe(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text; // deixa o texto bruto pra mensagens de erro
  }
}

function defaultHeaders(extra?: Record<string, string>) {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'xc-token': TOKEN,
    ...(extra || {}),
  };
}

function assertBase() {
  if (!BASE) throw new Error('VITE_NOCODB_URL não configurado');
}

function raiseNoco(res: Response, data: any): never {
  const msg =
    data?.message ||
    data?.error?.message ||
    (typeof data === 'string' ? data : '') ||
    `HTTP ${res.status}`;

  const err: any = new Error(`NocoDB ${res.status}: ${msg}`);
  err.details = { status: res.status, url: res.url, body: data };
  throw err;
}

// -------------------- LIST --------------------
export async function listWifi(): Promise<WifiNetwork[]> {
  assertBase();

  const res = await fetch(
    `${BASE}/api/v2/tables/${TABLE_ID}/records?limit=1000`,
    { headers: defaultHeaders({ 'Content-Type': undefined as any }) } // GET não precisa content-type
  );

  const data = await parseJsonSafe(res);
  if (!res.ok) raiseNoco(res, data);

  const list = ensureArray<unknown>(data).map(coerceWifi).filter(Boolean) as WifiNetwork[];
  return list;
}

// -------------------- CREATE --------------------
export type CreateWifiInput = {
  ['NOME-WIFI']: string;
  ['NOME-CLIENTE']?: string | null;
  LATITUDE: number;
  LONGITUDE: number;
  ['SENHA-WIFI-2G']?: string | null;
  ['SENHA-WIFI-5G']?: string | null;
};

export async function createWifi(input: CreateWifiInput): Promise<WifiNetwork> {
  assertBase();

  const res = await fetch(`${BASE}/api/v2/tables/${TABLE_ID}/records`, {
    method: 'POST',
    headers: defaultHeaders(),
    body: JSON.stringify(input),
  });

  const data = await parseJsonSafe(res);
  if (!res.ok) raiseNoco(res, data);

  // NocoDB costuma retornar o registro criado como objeto
  const coerced = coerceWifi(data);
  if (!coerced) throw new Error('Resposta inesperada ao criar Wi-Fi');
  return coerced as WifiNetwork;
}

export async function updateWifi(id: number, data: Partial<WifiNetwork>) {
  // ⚠️ ajuste esta URL para o seu backend/NocoDB
  const res = await fetch(`/api/wifi/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Falha ao atualizar Wi-Fi #${id}: ${res.status} ${text}`);
  }
  return res.json();
}

export async function updateWifi(id: number | string, patch: UpdateWifiInput): Promise<WifiNetwork> {
  assertBase();

  const res = await fetch(`${BASE}/api/v2/tables/${TABLE_ID}/records/${id}`, {
    method: 'PATCH',
    headers: defaultHeaders(),
    body: JSON.stringify(patch),
  });

  const data = await parseJsonSafe(res);
  if (!res.ok) raiseNoco(res, data);

  const coerced = coerceWifi(data);
  if (!coerced) throw new Error('Resposta inesperada ao atualizar Wi-Fi');
  return coerced as WifiNetwork;
}

// -------------------- DELETE (opcional) --------------------
export async function deleteWifi(id: number | string): Promise<void> {
  assertBase();

  const res = await fetch(`${BASE}/api/v2/tables/${TABLE_ID}/records/${id}`, {
    method: 'DELETE',
    headers: defaultHeaders({ 'Content-Type': undefined as any }),
  });

  const data = await parseJsonSafe(res);
  if (!res.ok) raiseNoco(res, data);
}
