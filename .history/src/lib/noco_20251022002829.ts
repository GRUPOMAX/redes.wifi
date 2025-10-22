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

// Ajuste no topo do arquivo, caso queira deixar configurável:
const PK_FIELD = 'Id'; // <- nome exato da PK na sua tabela

export async function updateWifi(rowId: number | string, data: Partial<WifiNetwork>) {
  assertBase();
  if (rowId === null || rowId === undefined || rowId === '') {
    throw new Error('updateWifi: rowId inválido');
  }

  // Monte o payload com a PK no corpo (como você precisa)
  const payloadFull: Record<string, any> = {
    [PK_FIELD]: rowId, // <- ID no payload
    ['NOME-WIFI']: data['NOME-WIFI'],
    ['NOME-CLIENTE']: data['NOME-CLIENTE'] ?? null,
    ['SENHA-WIFI-2G']: data['SENHA-WIFI-2G'] ?? null,
    ['SENHA-WIFI-5G']: data['SENHA-WIFI-5G'] ?? null,
    LATITUDE: data.LATITUDE != null ? String(data.LATITUDE) : null,
    LONGITUDE: data.LONGITUDE != null ? String(data.LONGITUDE) : null,
  };
  Object.keys(payloadFull).forEach((k) => payloadFull[k] === undefined && delete payloadFull[k]);

  // 1) Tentativa A: PATCH com id na URL (funciona no v2 "padrão")
  const urlA = `${BASE}/api/v2/tables/${TABLE_ID}/records/${encodeURIComponent(String(rowId))}`;
  let res = await fetch(urlA, {
    method: 'PATCH',
    headers: defaultHeaders(),
    body: JSON.stringify(payloadFull), // já vai com Id no corpo também
  });
  let body = await parseJsonSafe(res);

  // Se não rolou (404/405/400), 2) Tentativa B: PATCH /records com Id no payload
  if (!res.ok && (res.status === 404 || res.status === 405 || res.status === 400)) {
    const urlB = `${BASE}/api/v2/tables/${TABLE_ID}/records`;
    // alguns setups aceitam objeto; outros exigem array — tentamos objeto, depois array
    // B1: objeto
    let resB = await fetch(urlB, {
      method: 'PATCH',
      headers: defaultHeaders(),
      body: JSON.stringify(payloadFull),
    });
    let bodyB = await parseJsonSafe(resB);

    if (!resB.ok) {
      // B2: array (bulk) com 1 item
      resB = await fetch(urlB, {
        method: 'PATCH',
        headers: defaultHeaders(),
        body: JSON.stringify([payloadFull]),
      });
      bodyB = await parseJsonSafe(resB);

      if (!resB.ok) {
        // log detalhado pra depurar
        console.error('updateWifi (fallback /records) falhou', {
          urlA, urlB, rowId, payloadFull, bodyA: body, bodyB,
        });
        raiseNoco(resB, bodyB);
      }
    }
    return coerceWifi(bodyB);
  }

  if (!res.ok) {
    console.error('updateWifi  falhou (URL com id)', { urlA, rowId, payloadFull, body });
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



// -------------------- USERS (login) --------------------
export type UserRow = {
  id?: number | string;      // opcional, caso tua PK tenha outro nome
  email: string;
  password: string;
  ativo: boolean;
  is_admin: boolean;
};

// defina no .env: VITE_NOCODB_USERS_TABLE_ID=xxxxxxxxxxxx
const USERS_TABLE_ID =
  import.meta.env.VITE_NOCODB_USERS_TABLE_ID || 'COLOQUE_O_TABLE_ID_DOS_USERS_AQUI';

/** Busca 1 usuário por email (case-sensitive, padrão NocoDB). */
export async function getUserByEmail(email: string): Promise<UserRow | null> {
  assertBase();
  const url = `${BASE}/api/v2/tables/${USERS_TABLE_ID}/records?where=(email,eq,${encodeURIComponent(
    email
  )})&limit=1`;

  const res = await fetch(url, {
    headers: defaultHeaders({ 'Content-Type': undefined as any }),
  });
  const data = await parseJsonSafe(res);
  if (!res.ok) raiseNoco(res, data);

  // teu ensureArray já lida com list/data/records/objeto único
  const first = ensureArray<any>(data)[0] ?? null;
  if (!first) return null;

  // normaliza campos esperados
  return {
    id: first.Id ?? first.id ?? first[PK_FIELD] ?? undefined,
    email: first.email,
    password: first.password,
    ativo: !!first.ativo,
    is_admin: !!first.is_admin,
  };
}

/** Autentica localmente comparando a senha (simples, sem hash). */
export async function loginWithEmailPassword(email: string, password: string): Promise<UserRow> {
  const user = await getUserByEmail(email);
  if (!user) throw new Error('Usuário não encontrado');
  if (!user.ativo) throw new Error('Usuário inativo');
  if (user.password !== password) throw new Error('Senha incorreta');
  return user;
}
