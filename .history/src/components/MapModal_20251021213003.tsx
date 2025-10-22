// src/components/MapModal.tsx
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Props = {
  open: boolean;
  title?: string;
  center: { lat: number; lng: number } | null;
  onClose: () => void;
};

export default function MapModal({ open, title, center, onClose }: Props) {
  if (!open || !center) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-[#0b0b0c] w-full max-w-3xl h-[70vh] rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3 bg-black/50">
          <div className="font-medium text-sm">{title ?? "Mapa"}</div>
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm rounded bg-white/10 hover:bg-white/20"
          >
            Fechar
          </button>
        </div>
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={17}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[center.lat, center.lng]}>
            <Popup>{title ?? "Ponto"}</Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}
