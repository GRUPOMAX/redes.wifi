import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { useWifiList } from "../hooks/useWifi";
import WifiList from "./WifiList";
import WifiForm from "./w";
import MapModal from "./MapModal";
import type { WifiNetwork } from "../types";

// Corrige ícone padrão do Leaflet no Vite
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

export default function AdminPanel() {
  const { data, isLoading, isError, refetch } = useWifiList();
  const items = useMemo(() => data ?? [], [data]);

  const [mapOpen, setMapOpen] = useState(false);
  const [mapTitle, setMapTitle] = useState<string | undefined>(undefined);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // carregado pelo hook
  }, []);

  function openMapFor(item: WifiNetwork) {
    const lat = Number(item.LATITUDE);
    const lng = Number(item.LONGITUDE);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    setMapTitle(item["NOME-WIFI"]);
    setCenter({ lat, lng });
    setMapOpen(true);
  }

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Painel de Administração</h2>
        <button onClick={() => refetch()} className="px-3 py-1 text-sm rounded bg-white/10 hover:bg-white/20">
          Recarregar
        </button>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-black/20 p-4 rounded-xl shadow">
          <h3 className="font-medium mb-3">Cadastrar novo Wi-Fi</h3>
          <WifiForm />
        </section>

        <section className="bg-black/20 p-4 rounded-xl shadow">
          <h3 className="font-medium mb-3">Lista de redes</h3>
          {isLoading ? (
            <div className="text-sm text-gray-400">Carregando...</div>
          ) : isError ? (
            <div className="text-sm text-red-400">Erro ao carregar</div>
          ) : (
            <WifiList items={items} onViewOnMap={openMapFor} />
          )}
        </section>
      </div>

      <MapModal open={mapOpen} title={mapTitle} center={center} onClose={() => setMapOpen(false)} />
    </div>
  );
}
