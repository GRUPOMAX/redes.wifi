// src/hooks/useWifiNearest.ts
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listWifi } from '../lib/noco';
import { haversine } from '../utils/geo';
import type { WifiNetwork } from '../lib/wifi-types';

export function useWifiNearest(coords: GeolocationCoordinates | null) {
  const q = useQuery<WifiNetwork[]>({
    queryKey: ['wifi-list'],
    queryFn: listWifi,
    staleTime: 60_000,
    // listWifi já normaliza, então não precisamos de select aqui
  });

  const nearest = useMemo(() => {
    if (!coords || !Array.isArray(q.data) || q.data.length === 0) return null;

    const here = { lat: coords.latitude, lng: coords.longitude };
    let best: null | { d: number; item: WifiNetwork } = null;

    for (const w of q.data) {
      const lat = Number(w.LATITUDE);
      const lng = Number(w.LONGITUDE);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const d = haversine(here, { lat, lng });
        if (!best || d < best.d) best = { d, item: w };
      }
    }
    return best;
  }, [coords, q.data]);

  return { ...q, nearest };
}
