import type { WifiNetwork } from "../types";

interface WifiListProps {
  items: WifiNetwork[];
  onViewOnMap: (item: WifiNetwork) => void;
}

export default function WifiList({ items, onViewOnMap }: WifiListProps) {
  if (!items || items.length === 0)
    return <div className="text-sm text-gray-400">Nenhum Wi-Fi cadastrado</div>;

  return (
    <div className="space-y-2 max-h-[60vh] overflow-auto">
      {items.map((it) => (
        <div
          key={it.Id}
          className="flex justify-between items-center p-2 rounded bg-white/5 hover:bg-white/10"
        >
          <div>
            <div className="font-medium text-sm truncate">
              {it["NOME-WIFI"]}
            </div>
            <div className="text-xs text-gray-400">
              {it["NOME-CLIENTE"] ?? "—"}
            </div>
            <div className="text-xs text-gray-500">
              {it.LATITUDE}, {it.LONGITUDE}
            </div>
          </div>
          <button
            onClick={() => onViewOnMap(it)}
            className="px-2 py-1 text-sm rounded bg-white/10 hover:bg-white/20"
          >
            Ver no mapa
          </button>
        </div>
      ))}
    </div>
  );
}
