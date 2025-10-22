import { useState } from "react";
import type { WifiNetwork } from "../types";
import GoogleMapsUrlImporter from "./GoogleMapsUrlImporter";

interface WifiFormProps { onAdd: (data: Partial<WifiNetwork>) => void | Promise<void>; }

export default function WifiForm({ onAdd }: WifiFormProps) {
  const [nome, setNome] = useState("");
  const [cliente, setCliente] = useState("");
  const [senha2g, setSenha2g] = useState("");
  const [senha5g, setSenha5g] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [error, setError] = useState<string | null>(null);

  const nfix = (v: string) => Number(String(v).replace(",", "."));

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

    setNome(""); setCliente(""); setSenha2g(""); setSenha5g(""); setLat(""); setLng("");
  }

  function getMyLocation() {
    if (!("geolocation" in navigator)) return setError("Geolocalização não suportada");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(String(pos.coords.latitude)); setLng(String(pos.coords.longitude)); setError(null); },
      () => setError("Não foi possível obter localização"),
      { enableHighAccuracy: true }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="label">Nome do Wi-Fi</label>
          <input className="input" value={nome} onChange={(e)=>{ setNome(e.target.value); setError(null); }}
                 placeholder="Ex.: JOTA-FIBRA" />
        </div>
        <div>
          <label className="label">Nome do cliente</label>
          <input className="input" value={cliente} onChange={(e)=>{ setCliente(e.target.value); setError(null); }}
                 placeholder="Ex.: Maria Silva" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="label">Senha 2G (opcional)</label>
          <input className="input" value={senha2g} onChange={(e)=>setSenha2g(e.target.value)}
                 placeholder="senha 2.4GHz" />
        </div>
        <div>
          <label className="label">Senha 5G (opcional)</label>
          <input className="input" value={senha5g} onChange={(e)=>setSenha5g(e.target.value)}
                 placeholder="senha 5GHz" />
        </div>
      </div>

      <GoogleMapsUrlImporter
        onCoords={({ lat: L, lng: G }) => { setLat(String(L)); setLng(String(G)); setError(null); }}
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Latitude</label>
          <input className="input" value={lat} onChange={(e)=>{ setLat(e.target.value); setError(null); }}
                 placeholder="-20.3661" />
        </div>
        <div>
          <label className="label">Longitude</label>
          <input className="input" value={lng} onChange={(e)=>{ setLng(e.target.value); setError(null); }}
                 placeholder="-40.4246" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={getMyLocation} className="btn">Usar minha localização</button>
        <div className="flex-1" />
        <button type="submit" className="btn btn-accent">Cadastrar</button>
      </div>

      {error && <div className="helper text-red-300">{error}</div>}
    </form>
  );
}
