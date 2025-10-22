// src/lib/wifi-types.ts
export type WifiNetwork = {
  Id: number;
  ['NOME-WIFI']: string;
  ['SENHA-WIFI-2G']: string | null;
  ['SENHA-WIFI-5G']: string | null;
  LATITUDE: string; // mantemos string porque vem assim do NocoDB
  LONGITUDE: string;
};

export function ensureArray<T = unknown>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v && typeof v === 'object') {
    const anyObj = v as Record<string, unknown>;
    if (Array.isArray(anyObj.list)) return anyObj.list as T[];
    if (Array.isArray(anyObj.records)) return anyObj.records as T[];
    if (Array.isArray(anyObj.data)) return anyObj.data as T[];
    return [v as T]; // objeto unitário -> array unitário
  }
  return [];
}

export function coerceWifi(a: unknown): WifiNetwork | null {
  if (!a || typeof a !== 'object') return null;
  const o = a as any;
  const lat = Number(String(o.LATITUDE ?? o.latitude ?? o.lat ?? ''));
  const lng = Number(String(o.LONGITUDE ?? o.longitude ?? o.lng ?? ''));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    Id: Number(o.Id ?? o.id ?? Date.now()),
    ['NOME-WIFI']: String(o['NOME-WIFI'] ?? o.nome ?? o.name ?? ''),
    ['SENHA-WIFI-2G']: o['SENHA-WIFI-2G'] ?? null,
    ['SENHA-WIFI-5G']: o['SENHA-WIFI-5G'] ?? null,
    LATITUDE: String(lat),
    LONGITUDE: String(lng),
  };
}
