import { useState } from "react";
import type { WifiNetwork } from "../types";

interface WifiFormProps {
  onAdd: (data: Partial<WifiNetwork>) => void | Promise<void>;
}

export default function WifiForm({ onAdd }: WifiFormProps) {
  const [nome, setNome] = useState("");
  const [cliente, setCliente] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!nome.trim()) return "Nome do Wi-Fi obrigatório";
    if (!cliente.trim()) return "Nome do cliente obrigatório";
    if (!lat.trim() || !lng.trim()) return "Coordenadas obrigatórias";
    if (isNaN(Number(lat)) || isNaN(Number(lng)))
      return "Latitude e longitude precisam ser números";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) return setError(err);
    setError(null);
    await onAdd({
      ["NOME-WIFI"]: nome.trim(),
      ["NOME-CLIENTE"]: cliente.trim(),
      LATITUDE: Number(lat),
      LONGITUDE: Number(lng),
    });
    setNome("");
    setCliente("");
    setLat("");
    setLng("");
  }

  function getMyLocation() {
    if (!("geolocation" in navigator)) {
      setError("Geolocalização não suportada");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude));
        setLng(String(pos.coords.longitude));
      },
      () => setError("Não foi possível obter localização"),
      { enableHighAccuracy: true }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm">Nome do Wi-Fi</label>
        <input
          className="w-full px-3 py-2 rounded bg-white/10"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm">Nome do cliente</label>
        <input
          className="w-full px-3 py-2 rounded bg-white/10"
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm">Latitude</label>
          <input
            className="w-full px-3 py-2 rounded bg-white/10"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm">Longitude</label>
          <input
            className="w-full px-3 py-2 rounded bg-white/10"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={getMyLocation}
          className="px-3 py-1 text-sm rounded bg-white/10"
        >
          Usar minha localização
        </button>
        <button
          type="submit"
          className="px-4 py-1 text-sm rounded bg-accent ml-auto"
        >
          Cadastrar
        </button>
      </div>
      {error && <div className="text-sm text-red-400">{error}</div>}
    </form>
  );
}
