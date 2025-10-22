import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import WifiList from "./WifiList";
import WifiForm from "./WifiForm";
import type { WifiNetwork } from "../types";
import { listWifi } from "../lib/noco";

// Corrige ícone padrão do Leaflet no Vite
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

type LatLng = { lat: number; lng: number; name: string };

export default function AdminPanel() {
  const [wifiList, setWifiList] = useState<WifiNetwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    try {
      const data = await listWifi();
      setWifiList(data);
    } catch (err: any) {
      console.error(err);
      setError("Erro ao carregar redes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleAddWifi(newWifi: Partial<WifiNetwork>) {
    try {
      // aqui futuramente pode chamar a API POST do NocoDB
      const fakeId = Date.now();
      setWifiList((s) => [{ Id: fakeId, ...newWifi } as WifiNetwork, ...s]);
    } catch (err) {
      console.error(err);
    }
  }

  function openMapFor(item: WifiNetwork) {
    const lat = Number(item.LATITUDE);
    const lng = Number(item.LONGITUDE);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      alert("Coordenadas inválidas");
      return;
    }
    setMapCenter({ lat, lng, name: item["NOME-WIFI"] });
    setMapOpen(true);
  }

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Painel de Administração</h2>
        <button
          onClick={loadAll}
          className="px-3 py-1 text-sm rounded bg-white/10 hover:bg-white/20"
        >
          Recarregar
        </button>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-black/20 p-4 rounded-xl shadow">
          <h3 className="font-medium mb-3">Cadastrar novo Wi-Fi</h3>
          <WifiForm onAdd={handleAddWifi} />
        </section>

        <section className="bg-black/20 p-4 rounded-xl shadow">
          <h3 className="font-medium mb-3">Lista de redes</h3>
          {loading ? (
            <div className="text-sm text-gray-400">Carregando...</div>
          ) : error ? (
            <div className="text-sm text-red-400">{error}</div>
          ) : (
            <WifiList items={wifiList} onViewOnMap={openMapFor} />
          )}
        </section>
      </div>

      {mapOpen && mapCenter && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6"
          onClick={() => setMapOpen(false)}
        >
          <div
            className="bg-[#0b0b0c] w-full max-w-3xl h-[70vh] rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 bg-black/50">
              <div className="font-medium text-sm">{mapCenter.name}</div>
              <button
                onClick={() => setMapOpen(false)}
                className="px-3 py-1 text-sm rounded bg-white/10 hover:bg-white/20"
              >
                Fechar
              </button>
            </div>
            <MapContainer
              center={[mapCenter.lat, mapCenter.lng]}
              zoom={17}
              style={{ width: "100%", height: "100%" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[mapCenter.lat, mapCenter.lng]}>
                <Popup>{mapCenter.name}</Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
}
