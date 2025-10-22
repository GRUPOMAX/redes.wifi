import { useMemo, useState } from "react";
import type { WifiNetwork } from "../types";
import { ChevronLeft, ChevronRight, Copy, Wifi, Pencil } from "lucide-react";

interface WifiListProps {
  items: WifiNetwork[];
  onViewOnMap: (item: WifiNetwork) => void;
  onEdit: (item: WifiNetwork) => void;
  pageSize?: number;
}

function copyText(text: string) {
  if (!text) return;
  navigator.clipboard?.writeText(text).catch(() => {});
}

export default function WifiList({
  items,
  onViewOnMap,
  onEdit,
  pageSize = 5,
}: WifiListProps) {
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [justCopied, setJustCopied] = useState<string>("");

  const totalPages = Math.max(1, Math.ceil((items?.length ?? 0) / pageSize));
  const pageItems = useMemo(() => {
    if (!items?.length) return [];
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  if (!items?.length) {
    return <div className="text-sm text-gray-400">Nenhum Wi-Fi cadastrado</div>;
  }

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  const handleCopy = (label: string, value?: string | null) => {
    if (!value) return;
    copyText(value);
    setJustCopied(label);
    setTimeout(() => setJustCopied(""), 1200);
  };

  return (
    <div className="space-y-3">
      {/* Cabeçalho fixo */}
      <div className="flex items-center justify-between sticky top-0 z-10 bg-black/20 backdrop-blur-md rounded px-2 py-2">
        <div className="text-sm text-white/70">
          {items.length} {items.length === 1 ? "item" : "itens"}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            disabled={page === 1}
            className="p-2 rounded bg-white/10 enabled:hover:bg-white/20 disabled:opacity-40 active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-xs tabular-nums text-white/70">
            {page} / {totalPages}
          </div>
          <button
            onClick={goNext}
            disabled={page === totalPages}
            className="p-2 rounded bg-white/10 enabled:hover:bg-white/20 disabled:opacity-40 active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2 max-h-[60dvh] overflow-y-auto overflow-x-hidden pr-1">
        {pageItems.map((it) => {
          const isOpen = expandedId === it.Id;
          const lat = `${it.LATITUDE ?? ""}`.trim();
          const lng = `${it.LONGITUDE ?? ""}`.trim();
          const senha2g = it["SENHA-WIFI-2G"] ?? "";
          const senha5g = it["SENHA-WIFI-5G"] ?? "";

          return (
            <div
              key={it.Id}
              className="rounded border border-white/5 bg-white/5 hover:bg-white/10 transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => onEdit(it)}
                  title="Editar cadastro"
                >
                  <div className="flex items-center gap-1 text-sm font-medium truncate">
                    <Wifi className="w-4 h-4 text-white/50 shrink-0" />
                    {it["NOME-WIFI"] || "—"}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {it["NOME-CLIENTE"] ?? "—"}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {lat && lng ? `${lat}, ${lng}` : "—"}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                  <button
                    onClick={() => setExpandedId(isOpen ? null : it.Id)}
                    className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20"
                    aria-expanded={isOpen}
                  >
                    {isOpen ? "Ocultar" : "Senhas"}
                  </button>
                  <button
                    onClick={() => onViewOnMap(it)}
                    className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20"
                  >
                    Mapa
                  </button>
                  <button
                    onClick={() => onEdit(it)}
                    className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 inline-flex items-center gap-1"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Editar
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="px-3 pb-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="rounded bg-black/20 border border-white/5 p-2">
                      <div className="text-[11px] uppercase tracking-wide text-white/60">
                        Wi-Fi 2G
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <code className="text-sm break-all text-white/90">
                          {senha2g || "—"}
                        </code>
                        {senha2g && (
                          <button
                            onClick={() => handleCopy("2G", senha2g)}
                            className="p-1 rounded bg-white/10 hover:bg-white/20"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="rounded bg-black/20 border border-white/5 p-2">
                      <div className="text-[11px] uppercase tracking-wide text-white/60">
                        Wi-Fi 5G
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <code className="text-sm break-all text-white/90">
                          {senha5g || "—"}
                        </code>
                        {senha5g && (
                          <button
                            onClick={() => handleCopy("5G", senha5g)}
                            className="p-1 rounded bg-white/10 hover:bg-white/20"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {!!justCopied && (
                    <div className="mt-2 text-[11px] text-emerald-300/90">
                      Senha {justCopied} copiada!
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2 overflow-x-auto scrollbar-none">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`h-7 min-w-7 px-2 rounded text-xs border ${
                n === page
                  ? "bg-white/20 border-white/30"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
