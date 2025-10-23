import { useEffect } from 'react';
import type { WifiNetwork } from '../types';
import { getWifiId } from '../utils/getWifiId';

type Props = {
  open: boolean;
  items: WifiNetwork[];
  onClose: () => void;
  onPick?: (item: WifiNetwork) => void; // opcional: clicar no card foca o marker no mapa
};

async function copyToClipboard(text: string) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

export default function ClusterListModal({ open, items, onClose, onPick }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999]"
      aria-modal="true"
      role="dialog"
      aria-label="Redes Wi-Fi nesse agrupamento"
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* painel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-zinc-900 text-zinc-100 shadow-2xl flex flex-col overscroll-contain">
        <div
          aria-hidden
          className="shrink-0"
          style={{
            height: 'calc(env(safe-area-inset-top, 0px) + 10px)',
          }}
        />

        <header
          className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-white/10
                     bg-zinc-900/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/80"
        >
          <div className="text-sm opacity-70">Redes no ponto</div>
          <button
            onClick={onClose}
            aria-label="Fechar lista"
            className="rounded-lg px-3 py-2 text-sm hover:bg-white/10 active:bg-white/15
                       focus:outline-none focus:ring-2 focus:ring-indigo-500/70"
          >
            Fechar
          </button>
        </header>

        <div className="px-4 py-3 text-xs text-zinc-400">
          {items.length} {items.length === 1 ? 'rede' : 'redes'} encontradas
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
          {items.map((w) => (
            <article
              key={getWifiId(w)}
              className="rounded-xl bg-white/5 border border-white/10 p-3 hover:bg-white/8 transition
                         focus-within:ring-2 ring-indigo-500"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium text-sm truncate">{w['NOME-WIFI']}</h3>

              </div>

              <div className="mt-2 grid grid-cols-1 gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs opacity-80">2G</span>
                  <div className="flex items-center gap-2">
                    <code className="text-[11px] max-w-[180px] truncate opacity-90">
                      {w['SENHA-WIFI-2G'] || '—'}
                    </code>
                    <button
                      className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-40"
                      disabled={!w['SENHA-WIFI-2G']}
                      onClick={() => copyToClipboard(String(w['SENHA-WIFI-2G'] || ''))}
                    >
                      Copiar
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs opacity-80">5G</span>
                  <div className="flex items-center gap-2">
                    <code className="text-[11px] max-w-[180px] truncate opacity-90">
                      {w['SENHA-WIFI-5G'] || '—'}
                    </code>
                    <button
                      className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-40"
                      disabled={!w['SENHA-WIFI-5G']}
                      onClick={() => copyToClipboard(String(w['SENHA-WIFI-5G'] || ''))}
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
