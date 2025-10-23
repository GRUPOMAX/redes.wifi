import { useMemo, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useWifiList } from '../hooks/useWifi';
import WifiList from './WifiList';
import WifiForm from './WifiForm';
import MapModal from './MapModal';
import type { WifiNetwork } from '../types';
import { createWifi, updateWifi } from '../lib/noco';

import { LogOut, Map as MapIcon } from 'lucide-react';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

// util: classes compartilhadas pra manter consistência
const btn = {
  base:
    'inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium ' +
    'transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300/40',
  primary: 'bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-600',
  ghostDanger:
    'border border-rose-300/30 text-rose-200 hover:text-white ' +
    'hover:bg-rose-500/90 hover:border-rose-400/60 active:bg-rose-600/90',
};

function hrefHash(path: string) {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const clean = path.replace(/^#?\/?/, '');
  return `${base}/#/${clean}`;
}

export default function AdminPanel() {
  const { data, isLoading, isError, refetch } = useWifiList();
  const items = useMemo(() => data ?? [], [data]);

  const [mapOpen, setMapOpen] = useState(false);
  const [mapTitle, setMapTitle] = useState<string | undefined>(undefined);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [editing, setEditing] = useState<WifiNetwork | null>(null);

  async function handleSave(id: number | null, payload: Partial<WifiNetwork>) {
    if (id) await updateWifi(id, payload);
    else await createWifi(payload);
    await refetch();
    setEditing(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openMapFor(item: WifiNetwork) {
    const lat = Number((item as any).LATITUDE);
    const lng = Number((item as any).LONGITUDE);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    setMapTitle((item as any)['NOME-WIFI']);
    setCenter({ lat, lng });
    setMapOpen(true);
  }

  function startEdit(item: WifiNetwork) {
    setEditing(item);
    requestAnimationFrame(() => {
      document.getElementById('wifi-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function handleLogout() {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      sessionStorage.clear();
    } catch {}
    window.location.href = hrefHash('login'); // sempre /#/login com base correta
  }

  return (
    <div className="bg-app min-h-dvh text-slate-100 relative">
      {/* Topbar */}
      <header className="sticky top-0 z-20">
        <div
          className="mx-auto w-full max-w-6xl px-3 md:px-4 py-3 md:py-4
                      flex items-center gap-3 rounded-b-2xl
                      bg-white/[0.03] backdrop-blur supports-[backdrop-filter]:bg-white/[0.03]
                      border-b border-white/10"
        >
          <div
            className="size-8 rounded-lg bg-emerald-400/15 border border-emerald-300/20
                        flex items-center justify-center shrink-0"
          >
            <span className="text-emerald-300 font-black">W</span>
          </div>

          <h2 className="text-base md:text-lg font-semibold text-slate-100">
            Painel de Administração
          </h2>

          <div className="flex-1" />

          {/* Botão group: primário + ghost */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => (window.location.href = hrefHash('mapa'))}
              className={`${btn.base} ${btn.primary}`}
            >
              <MapIcon size={18} />
              Ver mapa
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className={`${btn.base} ${btn.ghostDanger}`}
              aria-label="Sair"
              title="Sair"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="mx-auto w-full max-w-6xl px-3 md:px-4 py-4 md:py-6 space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Formulário */}
          <section id="wifi-form" className="glass p-4 md:p-5">
            <h3 className="text-lg md:text-xl font-semibold mb-1">
              {editing ? `Editar: ${(editing as any)['NOME-WIFI']}` : 'Cadastrar novo Wi-Fi'}
            </h3>
            {editing && (
              <p className="helper mb-3">Atualize dados do cliente, senhas e localização.</p>
            )}
            <WifiForm initial={editing} onSave={handleSave} onCancelEdit={() => setEditing(null)} />
          </section>

          {/* Lista */}
          <section className="glass p-4 md:p-5 flex flex-col">
            <div className="flex items-center mb-3">
              <h3 className="text-lg md:text-xl font-semibold">Lista de redes</h3>
              <div className="flex-1" />
              <span className="helper">{items.length} itens</span>
            </div>

            <div className="scrolly overflow-auto max-h-[45dvh] md:max-h-[520px]">
              {isLoading ? (
                <div className="helper">Carregando…</div>
              ) : isError ? (
                <div className="helper text-red-300">Erro ao carregar</div>
              ) : (
                <WifiList items={items} onViewOnMap={openMapFor} onEdit={startEdit} />
              )}
            </div>
          </section>
        </div>
      </main>

      <MapModal open={mapOpen} title={mapTitle} center={center} onClose={() => setMapOpen(false)} />
    </div>
  );
}
