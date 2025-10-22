import { useMemo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { useWifiList } from "../hooks/useWifi";
import WifiList from "./WifiList";
import WifiForm from "./WifiForm";
import MapModal from "./MapModal";
import type { WifiNetwork } from "../types";
import { createWifi } from "../lib/noco";

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

  async function handleAdd(data: Partial<WifiNetwork>) {
    await createWifi(data);
    await refetch();
  }

  function openMapFor(item: WifiNetwork) {
    const lat = Number(item.LATITUDE), lng = Number(item.LONGITUDE);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    setMapTitle(item["NOME-WIFI"]);
    setCenter({ lat, lng });
    setMapOpen(true);
  }

  return (
    <div className="bg-app min-h-dvh text-slate-100">
      {/* Topbar */}
      <header className="sticky top-0 z-20 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center gap-3">
          <div className="size-8 rounded-lg bg-emerald-400/20 border border-emerald-300/25 flex items-center justify-center">
            <span className="text-emerald-300 font-black">W</span>
          </div>
          <h2 className="h2 text-xl">Painel de Administração</h2>
          <div className="flex-1" />
          <button onClick={() => refetch()} className="btn">Recarregar</button>
        </div>
        <div className="hr mx-auto max-w-6xl opacity-40" />
      </header>

      {/* Conteúdo */}
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <section className="glass p-5">
            <h3 className="h3 mb-3">Cadastrar novo Wi-Fi</h3>
            <WifiForm onAdd={handleAdd} />
          </section>

          <section className="glass p-5 flex flex-col">
            <div className="flex items-center mb-3">
              <h3 className="h3">Lista de redes</h3>
              <div className="flex-1" />
              <span className="helper">{items.length} itens</span>
            </div>

            <div className="scrolly overflow-auto max-h-[520px]">
              {isLoading ? (
                <div className="helper">Carregando…</div>
              ) : isError ? (
                <div className="helper text-red-300">Erro ao carregar</div>
              ) : (
                <WifiList items={items} onViewOnMap={openMapFor} />
              )}
            </div>
          </section>
        </div>
      </main>

      <MapModal open={mapOpen} title={mapTitle} center={center} onClose={() => setMapOpen(false)} />
    </div>
  );
}
