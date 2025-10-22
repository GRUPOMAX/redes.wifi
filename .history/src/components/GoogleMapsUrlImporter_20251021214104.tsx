import { useState } from "react";

export type Coords = { lat: number; lng: number };

export default function GoogleMapsUrlImporter({ onCoords }: { onCoords: (c: Coords) => void }) {
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  function parseGoogleMapsUrl(u: string): Coords | null {
    if (!u) return null;
    try {
      const decoded = decodeURIComponent(u.trim());

      // 1) /@lat,lng,zoom
      let m = decoded.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (m) return { lat: Number(m[1]), lng: Number(m[2]) };

      // 2) ...!3dLAT!4dLNG...
      m = decoded.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
      if (m) return { lat: Number(m[1]), lng: Number(m[2]) };

      // 3) ?q=lat,lng
      m = decoded.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (m) return { lat: Number(m[1]), lng: Number(m[2]) };

      // 4) ?ll=lat,lng
      m = decoded.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (m) return { lat: Number(m[1]), lng: Number(m[2]) };

      // 5) fallback: dois floats válidos próximos
      m = decoded.match(/(-?\d+\.\d+)[^\d\-]+(-?\d+\.\d+)/);
      if (m) {
        const lat = Number(m[1]);
        const lng = Number(m[2]);
        if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
      }
    } catch {}
    return null;
  }

  function handleExtract() {
    setMsg(null);
    const coords = parseGoogleMapsUrl(url);
    if (!coords) {
      setMsg("Cole a URL completa do Google Maps (ex.: .../@-20.123456,-40.123456,17z).");
      return;
    }
    onCoords(coords);
    setMsg(`Extraído: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
    setUrl("");
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs opacity-80">Colar URL do Google Maps</label>
      <div className="flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.google.com/maps/@-20.123456,-40.123456,17z"
          className="flex-1 px-2 py-1 rounded bg-white/5 text-sm"
        />
        <button type="button" onClick={handleExtract} className="px-3 py-1 rounded bg-white/10 text-sm">
          Extrair
        </button>
      </div>
      {msg && <div className="text-xs text-gray-300">{msg}</div>}
    </div>
  );
}
