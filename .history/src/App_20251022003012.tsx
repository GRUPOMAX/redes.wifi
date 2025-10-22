import { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MapView from './components/MapView';
import FloatingCard from './components/FloatingCard';
import { useGeo } from './store/useGeo';
import { useWifiNearest } from './hooks/useWifi';
import { listWifi } from './lib/noco';
import { LogOut } from 'lucide-react'; // ícone bonito e leve

const qc = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <Main />
    </QueryClientProvider>
  );
}

function Main() {
  const { coords, setCoords, setError, setWatchId } = useGeo();
  const [all, setAll] = useState<any[]>([]);

  useEffect(() => {
    listWifi()
      .then(setAll)
      .catch((e) => console.error('Erro ao listar Wi-Fi:', e));
  }, []);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocalização não suportada');
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => setCoords(pos.coords),
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 },
    );
    setWatchId(id);
    return () => navigator.geolocation.clearWatch(id);
  }, [setCoords, setError, setWatchId]);

  const { nearest } = useWifiNearest(coords);

  const userCoords = useMemo(
    () => (coords ? { lat: coords.latitude, lng: coords.longitude } : null),
    [coords],
  );

  const dist = useMemo(() => {
    if (!nearest || !coords) return null;
    const lat = parseFloat(nearest.item.LATITUDE as any);
    const lng = parseFloat(nearest.item.LONGITUDE as any);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371e3;
    const φ1 = toRad(coords.latitude);
    const φ2 = toRad(lat);
    const Δφ = toRad(lat - coords.latitude);
    const Δλ = toRad(lng - coords.longitude);
    const s = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }, [nearest, coords]);

  const MAX_DIST = 350;
  const nearestWithin = nearest && dist != null && dist <= MAX_DIST ? nearest.item : null;
  const distWithin = nearestWithin ? dist : null;

  function handleLogout() {
    // limpa dados locais e reinicia
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      {/* mapa de fundo */}
      <MapView
        allWifi={all}
        userCoords={userCoords}
        height="100dvh"
        className="absolute inset-0"
      />

      {/* cabeçalho com título */}
      <div className="absolute z-40 left-3 top-3 rounded-2xl px-3 py-2 border border-white/10 bg-[color:var(--card)] backdrop-blur">
        <div className="text-xs opacity-75">Projeto</div>
        <div className="font-semibold">Mapa Interativo • Wi-Fi</div>
      </div>

      {/* botão de logout */}
      <button
        onClick={handleLogout}
        title="Sair da conta"
        className="absolute z-40 top-3 right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors border border-white/10 backdrop-blur"
      >
        <LogOut size={18} />
      </button>

      {/* card flutuante */}
      <FloatingCard nearest={nearestWithin} distanceM={distWithin} />
    </div>
  );
}
