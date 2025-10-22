// src/components/MapModal.tsx
import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Props = {
  open: boolean;
  title?: string;
  center: { lat: number; lng: number } | null;
  onClose: () => void;
};

export default function MapModal({ open, title, center, onClose }: Props) {
  // ⚠️ NUNCA condicione hooks a `open`/`center`
  const mapRef = useRef<L.Map | null>(null);

  const wifiIcon = useMemo(
    () =>
      L.divIcon({
        className: "wifi-marker",
        html: `
          <div class="wifi-pin"></div>
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-4.24-6.24a1 1 0 0 0 1.41 1.41 5 5 0 0 1 7.06 0 1 1 0 0 0 1.41-1.41 7 7 0 0 0-9.88 0Zm-3.53-3.53a1 1 0 0 0 1.41 1.41 10 10 0 0 1 14.14 0 1 1 0 0 0 1.41-1.41 12 12 0 0 0-17 0Zm-3.53-3.53a1 1 0 0 0 1.41 1.41 15 15 0 0 1 21.22 0 1 1 0 1 0 1.41-1.41 17 17 0 0 0-24.04 0Z"/>
          </svg>
        `,
        iconSize: [32, 42],
        iconAnchor: [16, 40],
        popupAnchor: [0, -36],
      }),
    []
  );

  // Fecha com ESC (sempre registrado, mas só age se open)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (open && e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Trava scroll apenas quando aberto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Se não estiver aberto, não renderiza nada (mas note que os hooks acima já rodaram neste render também)
  if (!open || !center) return null;

  const { lat, lng } = center;
  const gmUrl = `https://www.google.com/maps/@${lat},${lng},19z`;

  // Recalibra o mapa ao abrir/mudar center
  useEffect(() => {
    const t = setTimeout(() => {
      mapRef.current?.invalidateSize();
      mapRef.current?.setView([lat, lng], 18, { animate: true });
    }, 40);
    return () => clearTimeout(t);
  }, [lat, lng, open]);

  const recenter = () =>
    mapRef.current?.setView([lat, lng], Math.max(18, mapRef.current?.getZoom() ?? 18), { animate: true });

  const copyCoords = async () => {
    try { await navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`); } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-4xl h-[78vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#0b0b0c]/95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-black/30">
          <div className="size-8 rounded-lg bg-emerald-400/15 border border-emerald-400/25 flex items-center justify-center">
            <span className="text-emerald-300 text-sm font-black">W</span>
          </div>
          <div className="font-semibold text-sm md:text-base line-clamp-1">{title ?? "Mapa"}</div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={recenter} className="px-3 py-1.5 text-sm rounded-lg bg-white/10 hover:bg-white/15 border border-white/10">Recentrar</button>
            <a href={gmUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 text-sm rounded-lg bg-white/10 hover:bg-white/15 border border-white/10">Abrir no Maps</a>
            <button onClick={copyCoords} className="px-3 py-1.5 text-sm rounded-lg bg-white/10 hover:bg-white/15 border border-white/10">Copiar coords</button>
            <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-lg bg-emerald-400 text-[#0b1220] font-semibold hover:brightness-105" title="Esc">Fechar</button>
          </div>
        </div>

        <MapContainer
          whenCreated={(m) => (mapRef.current = m)}
          center={[lat, lng]}
          zoom={18}
          zoomControl
          scrollWheelZoom
          doubleClickZoom
          touchZoom
          style={{ width: "100%", height: "calc(100% - 56px)" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
          <Marker position={[lat, lng]} icon={wifiIcon}>
            <Popup className="wifi-popup">{title ?? "Ponto"}</Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}
