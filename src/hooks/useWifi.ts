// src/hooks/useWifi.ts
import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listWifi, createWifi, updateWifi, deleteWifi } from '../lib/noco';
import { haversine } from '../utils/geo';
import type { WifiNetwork } from '../lib/wifi-types';

const KEY = ['wifi-list'];

/**
 * Hook principal de listagem com cache
 */
export function useWifiList() {
  return useQuery({
    queryKey: KEY,
    queryFn: listWifi,
    staleTime: 60_000, // 1 minuto
  });
}

/**
 * Hook que encontra o Wi-Fi mais próximo com base nas coordenadas do usuário
 */
export function useWifiNearest(coords: GeolocationCoordinates | null) {
  const q = useWifiList();

  const nearest = useMemo(() => {
    if (!coords || !q.data) return null;

    const here = { lat: coords.latitude, lng: coords.longitude };
    let best: { d: number; item: WifiNetwork } | null = null;

    for (const w of q.data) {
      const lat = parseFloat(String(w.LATITUDE));
      const lng = parseFloat(String(w.LONGITUDE));
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const d = haversine(here, { lat, lng });
        if (!best || d < best.d) best = { d, item: w };
      }
    }
    return best;
  }, [coords, q.data]);

  return { ...q, nearest };
}

/**
 * Hook para criar um novo registro de Wi-Fi
 */
export function useCreateWifi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createWifi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

/**
 * Hook opcional para atualizar um registro existente
 */
export function useUpdateWifi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number | string; patch: Partial<WifiNetwork> }) =>
      updateWifi(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/**
 * Hook opcional para deletar um registro
 */
export function useDeleteWifi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => deleteWifi(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
