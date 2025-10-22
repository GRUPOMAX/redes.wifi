import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listWifi } from '../lib/noco';
import { haversine } from '../utils/geo';

export function useWifiNearest(coords: GeolocationCoordinates | null) {
  const q = useQuery({ queryKey: ['wifi-list'], queryFn: listWifi, staleTime: 60_000 });

  const nearest = useMemo(() => {
    if (!coords || !q.data) return null;
    const here = { lat: coords.latitude, lng: coords.longitude };
    let best = null as null | { d: number; item: any };
    for (const w of q.data) {
      const lat = parseFloat(w.LATITUDE),
        lng = parseFloat(w.LONGITUDE);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const d = haversine(here, { lat, lng });
        if (!best || d < best.d) best = { d, item: w };
      }
    }
    return best;
  }, [coords, q.data]);

  return { ...q, nearest };
}
