import { useMemo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { useWifiList } from "../hooks/useWifi";
import WifiList from "./WifiList";
import WifiForm from "./WifiForm";
import MapModal from "./MapModal";
import type { WifiNetwork } from "../types";
import { createWifi, updateWifi } from "../lib/noco";

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

  const [editing, setEditing] = useState<WifiNetwork | null>(null);

  async function handleSave(id: number | null, payload: Partial<WifiNetwork>) {
    if (id) {
      await updateWifi(id, payload);
    } else {
      await createWifi(payload);
    }
    await refetch();
    setEditing(null);
    // no mobile, volta pro topo pra ver a lista atualizada
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openMapFor(item: WifiNetwork) {
    const lat = Number(item.LATITUDE), lng = Number(item.LONGITUDE);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    setMapTitle(item["NOME-WIFI"]);
    setCenter({ lat, lng });
    setMapOpen(true);
  }

  function startEdit(item: WifiNetwork) {
    setEditing(item);
    requestAnimationFrame(() => {
      document
        .getElementById("wifi-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div className="bg-app min-h-dvh text-slate-100">
      {/* Topbar */}
      <header className="sticky top-0 z-20 backdrop-blur-md">
        <div className="mx-auto w-full max-w-6xl px-3 md:px-4 py-3 md:py-4 flex items-center gap-3">
          <div className="size-8 rounded-lg bg-emerald-400/20 border border-emerald-300/25 flex items-center justify-center shrink-0">
            <span className="text-emerald-300 font-black">W</span>
          </div>
          <h2 className="text-base md:text-xl font-semibold">Painel de Administração</h2>
          <div className="flex-1" />
          <button
            onClick={() => refetch()}
            className="btn text-sm md:text-base px-3 md:px-4 py-1.5 md:py-2"
          >
            Recarregar
          </button>
        </div>
        <div className="hr mx-auto max-w-6xl opacity-40" />
      </header>

      {/* Conteúdo */}
      <main className="mx-auto w-full max-w-6xl px-3 md:px-4 py-4 md:py-6 space-y-4 md:space-y-6">
        {/* mobile-first: 1 coluna; em md+ vira 2 colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Formulário */}
          <section id="wifi-form" className="glass p-4 md:p-5">
            <h3 className="text-lg md:text-xl font-semibold mb-1">
              {editing ? `Editar: ${editing["NOME-WIFI"]}` : "Cadastrar novo Wi-Fi"}
            </h3>
            {editing && (
              <p className="helper mb-3">Atualize dados do cliente, senhas e localização.</p>
            )}
            <WifiForm
              initial={editing}
              onSave={handleSave}
              onCancelEdit={() => setEditing(null)}
            />
          </section>

          {/* Lista */}
          <section className="glass p-4 md:p-5 flex flex-col">
            <div className="flex items-center mb-3">
              <h3 className="text-lg md:text-xl font-semibold">Lista de redes</h3>
              <div className="flex-1" />
              <span className="helper">{items.length} itens</span>
            </div>

            {/* Altura responsiva: mais baixa no mobile pra não estourar a viewport */}
            <div className="scrolly overflow-auto max-h-[45dvh] md:max-h-[520px]">
              {isLoading ? (
                <div className="helper">Carregando…</div>
              ) : isError ? (
                <div className="helper text-red-300">Erro ao carregar</div>
              ) : (
                <WifiList items={items} onViewOnMap={openMapFor} onEdit={startEdit} />
              )}
            </div>
          </section>
        </div>
      </main>

      <MapModal
        open={mapOpen}
        title={mapTitle}
        center={center}
        onClose={() => setMapOpen(false)}
      />
    </div>
  );
}
