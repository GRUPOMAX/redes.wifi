import { create } from 'zustand';

type GeoState = {
  coords: GeolocationCoordinates | null;
  error: string | null;
  watchId: number | null;
  setCoords: (c: GeolocationCoordinates | null) => void;
  setError: (e: string | null) => void;
  setWatchId: (id: number | null) => void;
};

export const useGeo = create<GeoState>((set) => ({
  coords: null,
  error: null,
  watchId: null,
  setCoords: (c) => set({ coords: c }),
  setError: (e) => set({ error: e }),
  setWatchId: (id) => set({ watchId: id }),
}));
