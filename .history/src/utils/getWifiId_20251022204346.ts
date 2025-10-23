// src/utils/getWifiId.ts
import type { WifiNetwork } from '../types';

export function getWifiId(w: WifiNetwork): string {
  const id =
    (w as any).ID ??
    (w as any).Id ??
    (w as any).id ??
    `${String((w as any).LATITUDE).replace(',', '.').trim()},${String(
      (w as any).LONGITUDE
    ).replace(',', '.').trim()}`;
  return String(id);
}
