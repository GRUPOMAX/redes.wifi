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

// -------------------- UPDATE (opcional) --------------------
export type UpdateWifiInput = Partial<Omit<CreateWifiInput, 'LATITUDE' | 'LONGITUDE'>> & {
  LATITUDE?: number;
  LONGITUDE?: number;
};

export async function updateWifi(rowId: number | string, data: Partial<WifiNetwork>) {
  assertBase();
  if (rowId === null || rowId === undefined || rowId === '') {
    throw new Error('updateWifi: rowId inválido');
  }

  // ⚠️ Confirme que estes nomes batem 100% com as colunas da sua tabela no NocoDB
  const payload: Record<string, any> = {
    ['NOME-WIFI']: data['NOME-WIFI'],
    ['NOME-CLIENTE']: data['NOME-CLIENTE'] ?? null,
    ['SENHA-WIFI-2G']: data['SENHA-WIFI-2G'] ?? null,
    ['SENHA-WIFI-5G']: data['SENHA-WIFI-5G'] ?? null,
    LATITUDE: data.LATITUDE != null ? String(data.LATITUDE) : null,
    LONGITUDE: data.LONGITUDE != null ? String(data.LONGITUDE) : null,
  };

  // remove undefined para não sobrescrever campos sem querer
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

  const url = `${BASE}/api/v2/tables/${TABLE_ID}/records/${encodeURIComponent(String(rowId))}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: defaultHeaders(),
    body: JSON.stringify(payload),
  });

  const body = await parseJsonSafe(res);
  if (!res.ok) {
    // Dicas comuns quando dá 404
    if (res.status === 404) {
      console.error('updateWifi 404 → verifique se o rowId é a chave primária da tabela e se TABLE_ID está correto', { url, rowId, payload, body });
    }
    raiseNoco(res, body);
  }
  return coerceWifi(body);
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
