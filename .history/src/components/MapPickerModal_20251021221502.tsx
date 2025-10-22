import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Corrige ícones do Leaflet no Vite
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

export type LatLng = { lat: number; lng: number };

function isFiniteLatLng(v?: Partial<LatLng> | null): v is LatLng {
  return !!v && Number.isFinite(v.lat) && Number.isFinite(v.lng);
}

function nfix(v: string | number) {
  return Number(String(v).replace(",", "."));
}

function FitTo({ center }: { center: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, Math.max(15, map.getZoom() || 15), { animate: true });
  }, [center, map]);
  return null;
}

export default function MapPickerModal({
  open,
  onClose,
  onConfirm,
  initial,
  title = "Escolher localização no mapa",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (coords: LatLng) => void;
  initial?: Partial<LatLng> | null;
  title?: string;
}) {
  const initialCenter = useMemo<LatLng>(
    () =>
      isFiniteLatLng(initial)
        ? { lat: initial!.lat, lng: initial!.lng }
        : { lat: -15.7801, lng: -47.9292 }, // Brasília de fallback
    [initial]
  );

  const [pos, setPos] = useState<LatLng>(initialCenter);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setErr(null);
      setLoading(false);
      setPos(initialCenter);
    }
  }, [open, initialCenter]);

  async function geocode() {
    const q = query.trim();
    if (!q) {
      setErr("Digite um endereço/ referência para buscar.");
      return;
    }
    try {
      setLoading(true);
      setErr(null);
      // Nominatim simples — para produção considere um proxy + user-agent
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        q
      )}&limit=1&addressdetails=0`;
      const res = await fetch(url, {
        headers: { "Accept": "application/json" },
      });
      const data = (await res.json()) as Array<{ lat: string; lon: string }>;
      if (!data?.length) {
        setErr("Nada encontrado para essa consulta.");
      } else {
        const { lat, lon } = data[0];
        const next = { lat: nfix(lat), lng: nfix(lon) };
        if (Number.isFinite(next.lat) && Number.isFinite(next.lng)) {
          setPos(next);
        } else {
          setErr("Resposta inválida do geocoder.");
        }
      }
    } catch (e) {
      setErr("Falha ao buscar endereço.");
    } finally {
      setLoading(false);
    }
  }

  function myLocation() {
    if (!("geolocation" in navigator)) {
      setErr("Geolocalização não suportada no dispositivo.");
      return;
    }
    setErr(null);
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setErr("Não foi possível obter sua localização."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // Draggable marker state
  const markerRef = useRef<L.Marker | null>(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const m = markerRef.current;
        if (!m) return;
        const c = m.getLatLng();
        setPos({ lat: c.lat, lng: c.lng });
      },
    }),
    []
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden
      />
      {/* modal */}
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-3xl rounded-2xl bg-neutral-900 text-white ring-1 ring-white/10 shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center gap-3">
            <div className="text-lg font-semibold">{title}</div>
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15"
                onClick={myLocation}
                title="Usar minha localização"
              >
                Usar minha localização
              </button>
              <button
                type="button"
                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15"
                onClick={onClose}
              >
                Fechar
              </button>
            </div>
          </div>

          {/* search */}
          <div className="p-4 flex gap-2">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setErr(null);
              }}
              placeholder="Digite um endereço, ponto de referência ou CEP"
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 outline-none"
            />
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-sky-500/90 hover:bg-sky-500 disabled:opacity-60"
              onClick={geocode}
              disabled={loading}
            >
              {loading ? "Buscando..." : "Buscar"}
            </button>
          </div>

          {/* map */}
          <div className="px-4 pb-4">
            <div className="h-[380px] rounded-xl overflow-hidden ring-1 ring-white/10">
              <MapContainer
                center={pos}
                zoom={16}
                scrollWheelZoom
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitTo center={pos} />
                <Marker
                  draggable
                  eventHandlers={eventHandlers}
                  position={pos}
                  ref={markerRef as any}
                />
              </MapContainer>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="opacity-70">Coordenadas:</span>
              <code className="px-2 py-1 rounded bg-white/5 border border-white/10">
                {pos.lat.toFixed(6)}, {pos.lng.toFixed(6)}{" "}
                <span className="opacity-60">(lat, lng)</span>
              </code>
              <div className="ml-auto" />
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-emerald-500/90 hover:bg-emerald-500"
                onClick={() => onConfirm(pos)}
              >
                Confirmar localização
              </button>
            </div>

            {err && (
              <div className="mt-2 text-sm text-red-300">
                {err}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
