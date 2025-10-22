import { useState } from "react";

export type Coords = { lat: number; lng: number };

export default function GoogleMapsUrlImporter({ onCoords }: { onCoords: (c: Coords) => void }) {
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);

  function parseGoogleMapsUrl(u: string): Coords | null {
    if (!u) return null;
    try {
      const decoded = decodeURIComponent(u.trim());
      let m = decoded.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (m) return { lat: Number(m[1]), lng: Number(m[2]) };
      m = decoded.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
      if (m) return { lat: Number(m[1]), lng: Number(m[2]) };
      m = decoded.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (m) return { lat: Number(m[1]), lng: Number(m[2]) };
      m = decoded.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (m) return { lat: Number(m[1]), lng: Number(m[2]) };
      m = decoded.match(/(-?\d+\.\d+)[^\d\-]+(-?\d+\.\d+)/);
      if (m) {
        const lat = Number(m[1]), lng = Number(m[2]);
        if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
      }
    } catch {}
    return null;
  }

  function handleExtract() {
    setMsg(null); setOk(null);
    const coords = parseGoogleMapsUrl(url);
    if (!coords) {
      setOk(false);
      setMsg("Cole a URL completa do Google Maps (ex.: .../@-20.123456,-40.123456,17z).");
      return;
    }
    onCoords(coords);
    setOk(true);
    setMsg(`OK: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
    setUrl("");
  }

  return (
    <div className="space-y-2">
      <label className="label">Colar URL do Google Maps</label>
      <div className="flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.google.com/maps/@-20.123456,-40.123456,17z"
          className="input"
        />
        <button type="button" onClick={handleExtract} className="btn btn-ghost">
          Extrair
        </button>
      </div>
      {msg && (
        <div className={`helper ${ok ? "text-emerald-300" : "text-red-300"}`}>
          {msg}
        </div>
      )}
    </div>
  );
}
