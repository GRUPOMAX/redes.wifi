import { useEffect, useMemo, useState } from 'react';
import type { WifiNetwork } from '../types';

export function copyText(t: string) {
  navigator.clipboard?.writeText(t).catch(() => {});
}

const THRESHOLD_M = 350; // distância “certa” para piscar

export default function FloatingCard({
  nearest,
  distanceM,
}: {
  nearest: WifiNetwork | null;
  distanceM: number | null;
}) {
  const [open, setOpen] = useState(false);

  // no desktop, mantenha sempre aberto; no mobile, vem fechado
  useEffect(() => {
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    setOpen(isDesktop);
  }, []);

  const within = useMemo(
    () => nearest && typeof distanceM === 'number' && distanceM <= THRESHOLD_M,
    [nearest, distanceM],
  );

  // tarja simples quando não há rede por perto
  if (!nearest || distanceM == null) {
    return (
      <div
        className="fixed z-[1000] right-4 bottom-4 md:right-6 md:top-6 md:bottom-auto
                   pointer-events-auto max-w-[520px] rounded-2xl border border-white/10
                   bg-[color:var(--card)]/90 backdrop-blur-xl p-3 md:p-4 shadow-2xl"
      >
        <div className="text-sm opacity-80">
          Nenhum Wi-Fi em até <strong>{THRESHOLD_M} m</strong>.
        </div>
      </div>
    );
  }

  // MOBILE: tarja minimizada (mostra nome + bolinha) — toque para expandir
  return (
    <div
      className="fixed z-[1000] inset-x-3 bottom-3 md:inset-x-auto md:right-6 md:top-6 md:bottom-auto
                 pointer-events-auto max-w-[520px]"
    >
      <div
        className="rounded-2xl border border-white/10 bg-[color:var(--card)]/90 backdrop-blur-xl
                   shadow-2xl overflow-hidden"
      >
        {/* Cabeçalho (clique para abrir/fechar no mobile) */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 md:cursor-default"
        >
          <div className="flex items-center gap-3">
            {/* bolinha piscando quando está dentro do raio */}
            <span
              className={[
                'relative inline-flex h-3 w-3 rounded-full',
                within ? 'bg-emerald-400' : 'bg-white/40',
              ].join(' ')}
            >
              {within && (
                <span className="absolute inline-flex h-full w-full rounded-full animate-ping bg-emerald-400/60"></span>
              )}
            </span>
            <div className="text-left">
              <div className="text-[11px] uppercase opacity-70 leading-none">
                Wi-Fi mais próximo
              </div>
              <div className="text-sm font-semibold truncate max-w-[58vw] md:max-w-none">
                {nearest['NOME-WIFI']}
              </div>
            </div>
          </div>

          <div className="text-sm opacity-80 shrink-0">{Math.round(distanceM)} m</div>
        </button>

        {/* Corpo: no desktop sempre visível; no mobile só quando open=true */}
        {(open || window.matchMedia('(min-width: 768px)').matches) && (
          <div className="px-4 pb-4 grid gap-2">
            {nearest['SENHA-WIFI-2G'] && (
              <div className="flex items-center gap-2">
                <span className="text-sm shrink-0 w-10 opacity-70">2G</span>
                <code className="flex-1 text-sm bg-black/30 rounded px-2 py-1 border border-white/10 overflow-x-auto">
                  {nearest['SENHA-WIFI-2G']}
                </code>
                <button
                  className="px-2 py-1 rounded border border-white/15 hover:bg-white/10"
                  onClick={() => copyText(nearest['SENHA-WIFI-2G']!)}
                >
                  Copiar
                </button>
              </div>
            )}
            {nearest['SENHA-WIFI-5G'] && (
              <div className="flex items-center gap-2">
                <span className="text-sm shrink-0 w-10 opacity-70">5G</span>
                <code className="flex-1 text-sm bg-black/30 rounded px-2 py-1 border border-white/10 overflow-x-auto">
                  {nearest['SENHA-WIFI-5G']}
                </code>
                <button
                  className="px-2 py-1 rounded border border-white/15 hover:bg-white/10"
                  onClick={() => copyText(nearest['SENHA-WIFI-5G']!)}
                >
                  Copiar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
