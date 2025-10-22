import { useEffect, useState } from "react";
import type { WifiNetwork } from "../types";
import GoogleMapsUrlImporter from "./GoogleMapsUrlImporter";
import MapPickerModal from "./MapPickerModal";
import { MapPin } from "lucide-react"; // ⬅️ ícone compacto

interface WifiFormProps {
  initial?: WifiNetwork | null;
  onSave: (id: number | null, data: Partial<WifiNetwork>) => void | Promise<void>;
  onCancelEdit?: () => void;
}

export default function WifiForm({ initial = null, onSave, onCancelEdit }: WifiFormProps) {
  const [nome, setNome] = useState("");
  const [cliente, setCliente] = useState("");
  const [senha2g, setSenha2g] = useState("");
  const [senha5g, setSenha5g] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    if (initial) {
      setNome(initial["NOME-WIFI"] || "");
      setCliente((initial as any)["NOME-CLIENTE"] || "");
      setSenha2g(initial["SENHA-WIFI-2G"] || "");
      setSenha5g(initial["SENHA-WIFI-5G"] || "");
      setLat(String(initial.LATITUDE ?? ""));
      setLng(String(initial.LONGITUDE ?? ""));
      setError(null);
    } else {
      setNome(""); setCliente(""); setSenha2g(""); setSenha5g(""); setLat(""); setLng("");
      setError(null);
    }
  }, [initial]);

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

    await onSave(initial?.Id ?? null, {
      ["NOME-WIFI"]: nome.trim(),
      ["NOME-CLIENTE"]: cliente.trim(),
      ["SENHA-WIFI-2G"]: senha2g || null,
      ["SENHA-WIFI-5G"]: senha5g || null,
      LATITUDE: nfix(lat),
      LONGITUDE: nfix(lng),
    });
  }

  function getMyLocation() {
    if (!("geolocation" in navigator)) return setError("Geolocalização não suportada");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(String(pos.coords.latitude)); setLng(String(pos.coords.longitude)); setError(null); },
      () => setError("Não foi possível obter localização"),
      { enableHighAccuracy: true }
    );
  }

  function openMapPicker() { setMapOpen(true); }
  function onConfirmMap(coords: { lat: number; lng: number }) {
    setLat(String(coords.lat));
    setLng(String(coords.lng));
    setError(null);
    setMapOpen(false);
  }

  const editing = !!initial;

  const initialForMap = (() => {
    const la = Number(String(lat).replace(",", "."));
    const lo = Number(String(lng).replace(",", "."));
    if (Number.isFinite(la) && Number.isFinite(lo)) return { lat: la, lng: lo };
    return null;
  })();

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4" id="wifi-form">
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

        {/* Coordenadas — ícone de mapa embutido no campo Longitude */}
        <div className="grid grid-cols-2 gap-3 items-end">
          <div>
            <label className="label">Latitude</label>
            <input className="input" value={lat} onChange={(e)=>{ setLat(e.target.value); setError(null); }}
                   placeholder="-20.3661" />
          </div>

<div>
  <label className="label">Longitude</label>
  <div className="relative">
    <input
      className="input pr-12" // espaço pro botão
      value={lng}
      onChange={(e) => { setLng(e.target.value); setError(null); }}
      placeholder="-40.4246"
    />
    <button
      type="button"
      onClick={openMapPicker}
      title="Selecionar no mapa"
      aria-label="Selecionar no mapa"
      className="absolute inset-y-0 right-2 my-auto
                 inline-flex h-8 w-8 items-center justify-center
                 rounded-md border border-white/10
                 bg-white/5 hover:bg-white/10 transition"
    >
      <MapPin size={18} />
    </button>
  </div>
</div>

        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={getMyLocation} className="btn">Usar minha localização</button>
          <div className="flex-1" />
          {editing && onCancelEdit && (
            <button type="button" onClick={onCancelEdit} className="btn">Cancelar</button>
          )}
          <button type="submit" className="btn btn-accent">
            {editing ? "Atualizar" : "Cadastrar"}
          </button>
        </div>

        {error && <div className="helper text-red-300">{error}</div>}
      </form>

      <MapPickerModal
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        onConfirm={onConfirmMap}
        initial={initialForMap}
        title="Selecionar no mapa"
      />
    </>
  );
}
