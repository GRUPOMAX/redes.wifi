import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import ClusterListModal from './ClusterListModal';
import { getWifiId } from '../utils/getWifiId';

import L, { LeafletEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Plugin MarkerCluster
import 'leaflet.markercluster/dist/leaflet.markercluster.js';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import type { WifiNetwork } from '../types';
import { LogOut } from 'lucide-react';

// Corrige ícone padrão do Leaflet
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

type MarkerMap = Map<string, L.Marker>;
type ClusterClickEvent = LeafletEvent & {
  layer: L.MarkerCluster & { getAllChildMarkers?: () => L.Marker[] };
  originalEvent?: MouseEvent;
};

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

// Enquadra tudo uma vez (user + pontos)
function FitAllOnce({
  user,
  points,
  minZoom = 3,
}: {
  user?: { lat: number; lng: number } | null;
  points: Array<{ lat: number; lng: number }>;
  minZoom?: number;
}) {
  const map = useMap();
  const didFit = useRef(false);
  const prevCount = useRef<number>(0);

  useEffect(() => {
    if (didFit.current && prevCount.current === (points?.length ?? 0)) return;

    const bounds = L.latLngBounds([]);
    (points ?? []).forEach((p) => bounds.extend([p.lat, p.lng]));
    if (user) bounds.extend([user.lat, user.lng]);

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] });
      if (map.getZoom() < minZoom) map.setZoom(minZoom);
      didFit.current = true;
      prevCount.current = points?.length ?? 0;
    }
  }, [map, user, points, minZoom]);

  return null;
}

export default function MapView({
  allWifi = [],
  userCoords,
  onSelectWifi,
  onLogout,
  className = '',
  height = '70vh',
}: {
  allWifi?: WifiNetwork[] | null;
  userCoords?: { lat: number; lng: number } | null;
  onSelectWifi?: (w: WifiNetwork) => void;
  onLogout?: () => void;
  className?: string;
  height?: string | number;
}) {
  // normaliza entrada e gera lista de pontos válida
  const safeAll = Array.isArray(allWifi) ? allWifi : [];
  const points = useMemo(
    () =>
      safeAll
        .map((w) => ({
          raw: w,
          lat: Number(String((w as any).LATITUDE).replace(',', '.')),
          lng: Number(String((w as any).LONGITUDE).replace(',', '.')),
        }))
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)),
    [safeAll]
  );

  const initialCenter = userCoords ?? { lat: -15.78, lng: -47.93 };

  // modal cluster
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItems, setModalItems] = useState<WifiNetwork[]>([]);
  const markerByIdRef = useRef<MarkerMap>(new Map());
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // foco visual temporário
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const clearFocusTimer = useRef<number | null>(null);
  function setFocus(id: string | null, ttlMs = 4000) {
    setFocusedId(id);
    if (clearFocusTimer.current) window.clearTimeout(clearFocusTimer.current);
    if (id) clearFocusTimer.current = window.setTimeout(() => setFocusedId(null), ttlMs);
  }

  function openClusterModal(items: WifiNetwork[]) {
    setModalItems(items ?? []);
    setModalOpen(true);
  }

  function handlePickFromModal(item: WifiNetwork) {
  const map = mapRef.current;
  const clusterGroup = clusterRef.current;
  const id = getWifiId(item);
  const marker = markerByIdRef.current.get(id);

  console.log('pick id', id);
  console.log('has marker', !!marker);
  console.log('marker latlng', marker?.getLatLng?.());

  // fecha modal
  setModalOpen(false);
  if (!marker || !map) return;

  setTimeout(() => map.invalidateSize(), 0);

  const latlng = marker.getLatLng();
  const focusOnMarker = () => {
    const targetZoom = Math.max(map.getZoom(), 19);
    map.flyTo(latlng, targetZoom, { animate: true, duration: 0.6 });
    map.once('moveend', () => (marker as any).openPopup?.());
  };

  const zts = (clusterGroup as any)?.zoomToShowLayer;
  if (typeof zts === 'function') zts(marker as any, () => setTimeout(focusOnMarker, 30));
  else focusOnMarker();

  onSelectWifi?.(item);
}


  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const t = setTimeout(() => map.invalidateSize(), 0);
    return () => clearTimeout(t);
  }, [modalOpen]);

  const iconCreateFunction = (cluster: L.MarkerCluster) =>
    L.divIcon({
      html: `<div class="cluster-bubble"><span>${cluster.getChildCount()}</span></div>`,
      className: 'cluster-icon',
      iconSize: L.point(40, 40, true),
    });

  function defaultLogout() {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      sessionStorage.clear();
    } catch {}
    const { origin, pathname, hostname } = window.location;
    const isGhPages = hostname.endsWith('github.io');
    const repoBase = isGhPages ? '/' + (pathname.split('/').filter(Boolean)[0] || '') + '/' : '/';
    window.location.replace(`${origin}${repoBase}#/login`);
  }

  return (
    <div className={className} style={{ width: '100%', position: 'relative' }}>
      <button
        type="button"
        aria-label="Sair"
        title="Sair"
        onClick={() => (onLogout ? onLogout() : defaultLogout())}
        className="group absolute z-[5000] inline-flex items-center gap-2 rounded-xl
                   bg-white/90 px-3 py-2 text-sm font-medium text-gray-800 shadow-lg backdrop-blur
                   hover:bg-white right-3 top-3 md:bottom-3 md:top-auto"
      >
        <LogOut size={16} className="opacity-80 group-hover:opacity-100" />
        <span>Sair</span>
      </button>

      <ClusterListModal
        open={modalOpen}
        items={modalItems ?? []}
        onClose={() => setModalOpen(false)}
        onPick={handlePickFromModal}
      />

      <MapContainer
        whenCreated={(instance) => (mapRef.current = instance)}
        center={[initialCenter.lat, initialCenter.lng]}
        zoom={13}
        style={{ width: '100%', height, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}
        scrollWheelZoom
        doubleClickZoom
        touchZoom
        zoomControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MarkerClusterGroup
          ref={(ref) => (clusterRef.current = ref)}
          whenCreated={(instance) => (clusterRef.current = instance)}
          chunkedLoading
          showCoverageOnHover={false}
          zoomToBoundsOnClick={false}
          spiderfyOnMaxZoom={false}
          // @ts-ignore prop existe no plugin
          spiderfyOnEveryClick={false}
          disableClusteringAtZoom={19}
          iconCreateFunction={iconCreateFunction}
          eventHandlers={{
            clusterclick: (e: ClusterClickEvent) => {
              e.originalEvent?.preventDefault?.();
              e.originalEvent?.stopPropagation?.();
              const childMarkers: L.Marker[] = e.layer.getAllChildMarkers
                ? e.layer.getAllChildMarkers()
                : [];
              const items: WifiNetwork[] = childMarkers
                .map((m) => (m as any).options?.__wifi as WifiNetwork | undefined)
                .filter(Boolean) as WifiNetwork[];
              openClusterModal(items);
            },
          }}
        >
          {(points ?? []).map(({ raw, lat, lng }) => {
            const id = getWifiId(raw);
            const icon = (focusedId === id ? wifiIconFocused : wifiIcon) as any;

            return (
              <Marker
                key={id}
                position={[lat, lng]}
                icon={icon}
                riseOnHover
                ref={(ref) => {
                  if (ref) {
                    (ref as any).options.__wifi = raw;
                    markerByIdRef.current.set(id, ref as unknown as L.Marker);
                  } else {
                    markerByIdRef.current.delete(id);
                  }
                }}
                eventHandlers={{ click: () => setFocus(id) }}
              >
                <Popup className="wifi-popup" maxWidth={320} closeButton>
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">
                      {(raw as any)['NOME-WIFI'] ?? (raw as any).NOME ?? 'Wi-Fi'}
                    </div>
                    {'ENDERECO' in (raw as any) && (
                      <div className="text-xs opacity-70">{(raw as any).ENDERECO}</div>
                    )}
                    {'SENHA-WIFI-2G' in (raw as any) && (
                      <div className="text-xs">
                        Senha 2G: <strong>{(raw as any)['SENHA-WIFI-2G'] || '-'}</strong>
                      </div>
                    )}
                    {'SENHA-WIFI-5G' in (raw as any) && (
                      <div className="text-xs">
                        Senha 5G: <strong>{(raw as any)['SENHA-WIFI-5G'] || '-'}</strong>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>

        {userCoords && (
          <Marker
            position={[userCoords.lat, userCoords.lng]}
            icon={L.divIcon({
              className: 'user-dot',
              html: `<div class="user-dot__ball"></div>`,
              iconSize: [14, 14],
              iconAnchor: [7, 7],
            })}
          >
            <Popup>Você está aqui</Popup>
          </Marker>
        )}

        <FitAllOnce user={userCoords ?? null} points={(points ?? []).map((p) => ({ lat: p.lat, lng: p.lng }))} />
      </MapContainer>

      <style>{`
        .wifi-marker .wifi-pin {
          display: grid; place-items: center;
          width: 32px; height: 32px; border-radius: 999px;
          background: #1f2937; border: 2px solid rgba(255,255,255,.35);
          box-shadow: 0 8px 22px rgba(0,0,0,.35);
          transform: translateY(-6px);
        }
        .wifi-marker svg { fill: #e5e7eb; }

        .wifi-marker.wifi-marker--focused .wifi-pin {
          background: #22c55e; border-color: rgba(34,197,94,.9);
          box-shadow: 0 0 0 6px rgba(34,197,94,.18), 0 10px 28px rgba(0,0,0,.45);
          animation: wifi-pop 420ms ease-out;
        }
        .wifi-marker.wifi-marker--focused svg { fill: #08130b; }

        @keyframes wifi-pop {
          0% { transform: translateY(-6px) scale(.85); }
          60% { transform: translateY(-6px) scale(1.06); }
          100% { transform: translateY(-6px) scale(1); }
        }

        .cluster-icon { background: transparent; border: none; }
        .cluster-bubble {
          width: 40px; height: 40px; border-radius: 999px;
          display: grid; place-items: center;
          font: 600 12px/1 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu;
          color: #0b1220; background: #a7f3d0; border: 2px solid #10b981;
          box-shadow: 0 8px 20px rgba(0,0,0,.35), inset 0 0 0 2px rgba(255,255,255,.6);
        }

        .user-dot__ball {
          width: 14px; height: 14px; border-radius: 999px;
          background: #60a5fa; box-shadow: 0 0 0 6px rgba(96,165,250,.25);
        }

        .leaflet-popup-content { margin: 8px 12px; }
      `}</style>
    </div>
  );
}
