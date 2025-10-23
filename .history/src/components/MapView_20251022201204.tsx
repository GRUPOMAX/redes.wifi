// src/components/MapView.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Plugin MarkerCluster (JS + CSS)
import 'leaflet.markercluster/dist/leaflet.markercluster.js';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import ClusterListModal from './ClusterListModal';
import type { WifiNetwork } from '../types';

// ========================
// Tipos/Helpers
// ========================
type MarkerMap = Map<string, L.Marker>;

export type MapPoint = {
  raw: WifiNetwork;
  lat: number;
  lng: number;
};

type Props = {
  points: MapPoint[];
  tileUrl?: string;
  minZoom?: number;
  maxZoom?: number;
};

// id estável para chave + mapa de refs + lookup no modal
const getId = (w: WifiNetwork) => String((w as any).Id ?? `${(w as any).LATITUDE},${(w as any).LONGITUDE}`);

// Ícone base (divIcon para poder trocar cor no foco)
const wifiIcon = L.divIcon({
  className: 'wifi-marker',
  html: `
    <div class="wifi-pin">
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M12 18.5a1.5 1.5 0 1 0 .001 3.001A1.5 1.5 0 0 0 12 18.5z" />
        <path d="M4.93 14.93a8 8 0 0 1 14.14 0l-1.77 1.06a6 6 0 0 0-10.6 0l-1.77-1.06z" />
        <path d="M2.1 11.1A12 12 0 0 1 21.9 11.1l-1.78 1.06a10 10 0 0 0-15.24 0L2.1 11.1z" />
      </svg>
    </div>
  `,
  iconSize: [32, 42],
  iconAnchor: [16, 40],
  popupAnchor: [0, -38],
});

// Ícone em foco (cor diferente + leve pop)
const wifiIconFocused = L.divIcon({
  className: 'wifi-marker wifi-marker--focused',
  html: `
    <div class="wifi-pin">
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M12 18.5a1.5 1.5 0 1 0 .001 3.001A1.5 1.5 0 0 0 12 18.5z" />
        <path d="M4.93 14.93a8 8 0 0 1 14.14 0l-1.77 1.06a6 6 0 0 0-10.6 0l-1.77-1.06z" />
        <path d="M2.1 11.1A12 12 0 0 1 21.9 11.1l-1.78 1.06a10 10 0 0 0-15.24 0L2.1 11.1z" />
      </svg>
    </div>
  `,
  iconSize: [32, 42],
  iconAnchor: [16, 40],
  popupAnchor: [0, -38],
});

// ========================
// Componente
// ========================
export default function MapView({
  points,
  tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  minZoom = 3,
  maxZoom = 19,
}: Props) {
  // centro inicial: primeiro ponto, senão Brasil central, por educação cartográfica
  const initialCenter = useMemo<[number, number]>(() => {
    if (points?.length) return [points[0].lat, points[0].lng];
    return [-15.78, -47.93]; // Brasília-ish
  }, [points]);

  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const markerByIdRef = useRef<MarkerMap>(new Map());

  // Modal com itens do cluster clicado
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItems, setModalItems] = useState<WifiNetwork[]>([]);

  // Foco visual temporário
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const clearFocusTimer = useRef<number | null>(null);

  function setFocus(id: string | null, ttlMs = 4000) {
    setFocusedId(id);
    if (clearFocusTimer.current) window.clearTimeout(clearFocusTimer.current);
    if (id) {
      clearFocusTimer.current = window.setTimeout(() => setFocusedId(null), ttlMs);
    }
  }

  // botão “Ver no mapa” do modal → foca o marker
  function handlePickFromModal(item: WifiNetwork) {
    const map = mapRef.current;
    const clusterGroup = clusterRef.current;
    const id = getId(item);
    const marker = markerByIdRef.current.get(id);

    // fecha modal antes de animar
    setModalOpen(false);

    if (!marker || !map) return;

    // reflow do mapa após o overlay sumir
    setTimeout(() => map.invalidateSize(), 0);

    const latlng = marker.getLatLng();

    const focusOnMarker = () => {
      setFocus(id); // muda cor
      const targetZoom = Math.max(map.getZoom(), 19);
      map.flyTo(latlng, targetZoom, { animate: true, duration: 0.6 });
      map.once('moveend', () => {
        (marker as any).openPopup?.();
      });
    };

    const zts = (clusterGroup as any)?.zoomToShowLayer;
    if (typeof zts === 'function') {
      // abre caminho até o marker e só então foca
      zts(marker as any, () => setTimeout(focusOnMarker, 30));
    } else {
      focusOnMarker();
    }
  }

  // cria lista do modal a partir do cluster clicado
  function openClusterModalFromEvent(e: any) {
    e.originalEvent?.preventDefault?.();
    e.originalEvent?.stopPropagation?.();

    const childMarkers: L.Marker[] = e.layer.getAllChildMarkers
      ? e.layer.getAllChildMarkers()
      : [];

    const items: WifiNetwork[] = childMarkers
      .map((m) => (m as any).options?.__wifi as WifiNetwork | undefined)
      .filter(Boolean) as WifiNetwork[];

    if (items.length) {
      setModalItems(items);
      setModalOpen(true);
    }
  }

  // limpa ícone focado ao clicar no mapa
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const onMapClick = () => setFocus(null);
    map.on('click', onMapClick);
    return () => {
      map.off('click', onMapClick);
    };
  }, []);

  return (
    <>
      <MapContainer
        center={initialCenter}
        zoom={13}
        minZoom={minZoom}
        maxZoom={maxZoom}
        style={{ width: '100%', height: '100%' }}
        whenCreated={(m) => (mapRef.current = m)}
        zoomControl
      >
        <TileLayer url={tileUrl} />

        <MarkerClusterGroup
          ref={(ref) => (clusterRef.current = ref)}
          whenCreated={(instance) => (clusterRef.current = instance)}
          chunkedLoading
          showCoverageOnHover={false}
          zoomToBoundsOnClick={false}
          spiderfyOnMaxZoom={false}
          // @ts-ignore – prop existe no plugin, mas não tipada
          spiderfyOnEveryClick={false}
          disableClusteringAtZoom={19}
          iconCreateFunction={(cluster) => {
            const count = cluster.getChildCount();
            // cluster “simples” que respeita dark mode
            return L.divIcon({
              html: `<div class="wifi-cluster">${count}</div>`,
              className: 'wifi-cluster-wrap',
              iconSize: [40, 40],
            });
          }}
          eventHandlers={{
            clusterclick: openClusterModalFromEvent,
          }}
        >
          {points.map(({ raw, lat, lng }) => {
            const id = getId(raw);
            const icon = focusedId === id ? wifiIconFocused : wifiIcon;

            return (
              <Marker
                key={id}
                position={[lat, lng]}
                icon={icon}
                riseOnHover
                ref={(ref) => {
                  if (ref) {
                    (ref as any).options.__wifi = raw; // usado para montar lista do modal
                    markerByIdRef.current.set(id, ref as unknown as L.Marker);
                  } else {
                    markerByIdRef.current.delete(id);
                  }
                }}
                eventHandlers={{
                  click: () => {
                    setFocus(id);
                  },
                }}
              >
                <Popup className="wifi-popup" maxWidth={320} closeButton>
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">{(raw as any).NOME ?? 'Wi-Fi'}</div>
                    {'ENDERECO' in (raw as any) && (
                      <div className="text-xs opacity-70">{(raw as any).ENDERECO}</div>
                    )}
                    {'SENHA' in (raw as any) && (
                      <div className="text-xs">
                        Senha: <strong>{(raw as any).SENHA}</strong>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Modal de “Redes no ponto” */}
      <ClusterListModal
        open={modalOpen}
        items={modalItems}
        onClose={() => setModalOpen(false)}
        onPick={handlePickFromModal}
      />

      {/* Estilos mínimos para cluster/marker focado (inline aqui por praticidade) */}
      <style>{`
        .wifi-marker .wifi-pin {
          display: grid; place-items: center;
          width: 32px; height: 32px; border-radius: 999px;
          background: #1f2937; /* gray-800 */
          border: 2px solid rgba(255,255,255,.35);
          box-shadow: 0 8px 22px rgba(0,0,0,.35);
          transform: translateY(-6px);
        }
        .wifi-marker svg { fill: #e5e7eb; } /* gray-200 */

        .wifi-marker.wifi-marker--focused .wifi-pin {
          background: #22c55e; /* accent */
          border-color: rgba(34,197,94,.9);
          box-shadow: 0 0 0 6px rgba(34,197,94,.18), 0 10px 28px rgba(0,0,0,.45);
          animation: wifi-pop 420ms ease-out;
        }
        .wifi-marker.wifi-marker--focused svg { fill: #08130b; }

        @keyframes wifi-pop {
          0% { transform: translateY(-6px) scale(.85); }
          60% { transform: translateY(-6px) scale(1.06); }
          100% { transform: translateY(-6px) scale(1); }
        }

        .wifi-cluster-wrap {
          background: transparent;
          border: none;
        }
        .wifi-cluster {
          width: 40px; height: 40px; border-radius: 999px;
          display: grid; place-items: center;
          font: 600 12px/1.1 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu;
          color: #0b1220;
          background: #a7f3d0; /* emerald-200 */
          border: 2px solid #10b981; /* emerald-500 */
          box-shadow: 0 8px 20px rgba(0,0,0,.35), inset 0 0 0 2px rgba(255,255,255,.6);
        }

        .leaflet-popup-content { margin: 8px 12px; }
      `}</style>
    </>
  );
}
