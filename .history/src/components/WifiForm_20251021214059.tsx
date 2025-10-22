import { useState } from "react";
import type { WifiNetwork } from "../types";
import GoogleMapsUrlImporter from "./GoogleMapsUrlImporter"; // ajuste o path se precisar

interface WifiFormProps {
  onAdd: (data: Partial<WifiNetwork>) => void | Promise<void>;
}

export default function WifiForm({ onAdd }: WifiFormProps) {
  const [nome, setNome] = useState("");
  const [cliente, setCliente] = useState("");
  const [senha2g, setSenha2g] = useState("");
  const [senha5g, setSenha5g] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [error, setError] = useState<string | null>(null);

  const nfix = (v: string) => Number(v.replace(",", ".")); // vírgula -> ponto

  function validate(): string | null {
    if (!nome.trim()) return "Nome do Wi-Fi obrigatório";
    if (!cliente.trim()) return "Nome do cliente obrigatório";
    if (!lat.trim() || !lng.trim()) return "Coordenadas obrigatórias";
    if (!Number.isFinite(nfix(lat)) || !Number.isFinite(nfix(lng)))
      return "Latitude e longitude precisam ser números válidos";
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
      ["SENHA-WIFI-2G"]: senha2g || null,
      ["SENHA-WIFI-5G"]: senha5g || null,
      LATITUDE: nfix(lat),
      LONGITUDE: nfix(lng),
    });

    // limpa o form
    setNome("");
    setCliente("");
    setSenha2g("");
    setSenha5g("");
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
        setError(null);
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
          onChange={(e) => { setNome(e.target.value); setError(null); }}
          placeholder="Ex.: JOTA-FIBRA"
        />
      </div>

      <div>
        <label className="block text-sm">Nome do cliente</label>
        <input
          className="w-full px-3 py-2 rounded bg-white/10"
          value={cliente}
          onChange={(e) => { setCliente(e.target.value); setError(null); }}
          placeholder="Ex.: Maria Silva"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-2">
        <div>
          <label className="block text-sm">Senha 2G (opcional)</label>
          <input
            className="w-full px-3 py-2 rounded bg-white/10"
            value={senha2g}
            onChange={(e) => setSenha2g(e.target.value)}
            placeholder="senha 2.4GHz"
          />
        </div>
        <div>
          <label className="block text-sm">Senha 5G (opcional)</label>
          <input
            className="w-full px-3 py-2 rounded bg-white/10"
            value={senha5g}
            onChange={(e) => setSenha5g(e.target.value)}
            placeholder="senha 5GHz"
          />
        </div>
      </div>

      {/* Importador de URL do Google Maps */}
      <GoogleMapsUrlImporter
        onCoords={({ lat: parsedLat, lng: parsedLng }) => {
          setLat(String(parsedLat));
          setLng(String(parsedLng));
          setError(null);
        }}
      />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm">Latitude</label>
          <input
            className="w-full px-3 py-2 rounded bg-white/10"
            value={lat}
            onChange={(e) => { setLat(e.target.value); setError(null); }}
            placeholder="-20.3661"
          />
        </div>
        <div>
          <label className="block text-sm">Longitude</label>
          <input
            className="w-full px-3 py-2 rounded bg-white/10"
            value={lng}
            onChange={(e) => { setLng(e.target.value); setError(null); }}
            placeholder="-40.4246"
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
