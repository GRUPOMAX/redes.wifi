// MapView.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import ClusterListModal from './ClusterListModal';

import L, { LeafletEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ⚠️ habilita o plugin clássico e faz augmentation de tipos (L.MarkerCluster, getAllChildMarkers, etc.)
import 'leaflet.markercluster/dist/leaflet.markercluster.js';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import type { WifiNetwork } from '../types';
import { LogOut } from 'lucide-react'; // ícone do botão

// Corrige ícone padrão do Leaflet
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

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
    if (didFit.current && prevCount.current === points.length) return;

    const bounds = L.latLngBounds([]);
    for (const p of points) bounds.extend([p.lat, p.lng]);
    if (user) bounds.extend([user.lat, user.lng]);

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] });
      if (map.getZoom() < minZoom) map.setZoom(minZoom);
      didFit.current = true;
      prevCount.current = points.length;
    }
  }, [map, user, points, minZoom]);

  return null;
}

type MarkerMap = Map<number, L.Marker>;

export default function MapView({
  allWifi = [],
  userCoords,
  onSelectWifi,
  onLogout, // ⬅️ nova prop
  className = '',
  height = '70vh',
}: {
  allWifi: WifiNetwork[];
  userCoords?: { lat: number; lng: number } | null;
  onSelectWifi?: (w: WifiNetwork) => void;
  onLogout?: () => void; // ⬅️ nova prop
  className?: string;
  height?: string | number;
}) {
  const points = useMemo(() => {
    return allWifi
      .map((w) => ({
        raw: w,
        lat: Number(String(w.LATITUDE).replace(',', '.')),
        lng: Number(String(w.LONGITUDE).replace(',', '.')),
      }))
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  }, [allWifi]);

  const initialCenter = userCoords ?? { lat: -15.78, lng: -47.93 };

  // ===== modal de cluster
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItems, setModalItems] = useState<WifiNetwork[]>([]);
  const markerByIdRef = useRef<MarkerMap>(new Map());

  // ref do mapa para não acessar marker._map
  const mapRef = useRef<L.Map | null>(null);

  function openClusterModal(items: WifiNetwork[]) {
    setModalItems(items);
    setModalOpen(true);
  }

  function handlePickFromModal(item: WifiNetwork) {
    const m = markerByIdRef.current.get(item.Id);
    const map = mapRef.current;
    if (m && map) {
      const ll = m.getLatLng();
      map.setView(ll, Math.max(17, map.getZoom()));
      (m as any).openPopup?.();
    }
    onSelectWifi?.(item);
    setModalOpen(false);
  }

  const iconCreateFunction = (cluster: L.MarkerCluster) => {
    const count = cluster.getChildCount();
    return L.divIcon({
      html: `<div class="cluster-bubble"><span>${count}</span></div>`,
      className: 'cluster-icon',
      iconSize: L.point(40, 40, true),
    });
  };

  // tipo do evento do plugin clássico
  type ClusterClickEvent = LeafletEvent & {
    layer: L.MarkerCluster & { getAllChildMarkers?: () => L.Marker[] };
    originalEvent?: MouseEvent;
  };

// ===== handler padrão de logout (caso não passem onLogout)
function defaultLogout() {
  try {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    sessionStorage.clear();
  } catch {}

  // Vamos sempre mandar para a rota hash "#/login".
  // Em GitHub Pages, o app roda em /<repo>/, então preservamos esse base.
  const { origin, pathname, hostname } = window.location;

  const isGhPages = hostname.endsWith("github.io");

  // Detecta o "repo base" quando está no GitHub Pages (ex: "/redes.wifi/")
  const repoBase = isGhPages
    ? "/" + (pathname.split("/").filter(Boolean)[0] || "") + "/"
    : "/";

  // Destino final usando HashRouter
  const target = `${origin}${repoBase}#/login`;

  // Redireciona sem deixar a URL ambígua
  window.location.replace(target);
}


  return (
    <div className={className} style={{ width: '100%', position: 'relative' }}>
        {/* Botão de Logout sobre o mapa */}
        <button
          type="button"
          aria-label="Sair"
          title="Sair"
          onClick={() => (onLogout ? onLogout() : defaultLogout())}
          className="
            group absolute z-[5000] inline-flex items-center gap-2 rounded-xl
            bg-white/90 px-3 py-2 text-sm font-medium text-gray-800 shadow-lg backdrop-blur
            hover:bg-white
            right-3 top-3           /* posição padrão: mobile → topo direito */
            md:bottom-3 md:top-auto /* no desktop → desce para baixo */
          "
        >
          <LogOut size={16} className="opacity-80 group-hover:opacity-100" />
          <span>Sair</span>
        </button>


      <ClusterListModal
        open={modalOpen}
        items={modalItems}
        onClose={() => setModalOpen(false)}
        onPick={handlePickFromModal}
      />

      <MapContainer
        whenCreated={(m) => (mapRef.current = m)}
        center={[initialCenter.lat, initialCenter.lng]}
        zoom={13}
        style={{ width: '100%', height, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        touchZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MarkerClusterGroup
          chunkedLoading
          showCoverageOnHover={false}
          zoomToBoundsOnClick={false}
          spiderfyOnMaxZoom={false}
          // @ts-ignore – prop existe no plugin, mas não tipada no shim
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
          {points.map(({ raw, lat, lng }) => (
            <Marker
              key={raw.Id}
              position={[lat, lng]}
              icon={wifiIcon}
              ref={(ref) => {
                if (ref) {
                  (ref as any).options.__wifi = raw;
                  markerByIdRef.current.set(raw.Id, ref as unknown as L.Marker);
                } else {
                  markerByIdRef.current.delete(raw.Id);
                }
              }}
              eventHandlers={{ click: () => onSelectWifi?.(raw) }}
              riseOnHover
            >
              <Popup className="wifi-popup" maxWidth={320} closeButton>
                <div className="wifi-card">
                  <div className="wifi-card__title">
                    <span className="wifi-card__dot" />
                    {raw['NOME-WIFI']}
                  </div>
                  <div className="wifi-card__coords">
                    {lat.toFixed(6)}, {lng.toFixed(6)}
                  </div>

                  <div className="wifi-card__row">
                    <span>2G</span>
                    <div className="wifi-card__value">
                      <code>{raw['SENHA-WIFI-2G'] || '-'}</code>
                      <button
                        type="button"
                        className="wifi-card__btn"
                        disabled={!raw['SENHA-WIFI-2G']}
                        onClick={() =>
                          navigator.clipboard?.writeText(String(raw['SENHA-WIFI-2G'] || ''))
                        }
                      >
                        Copiar
                      </button>
                    </div>
                  </div>

                  <div className="wifi-card__row">
                    <span>5G</span>
                    <div className="wifi-card__value">
                      <code>{raw['SENHA-WIFI-5G'] || '-'}</code>
                      <button
                        type="button"
                        className="wifi-card__btn"
                        disabled={!raw['SENHA-WIFI-5G']}
                        onClick={() =>
                          navigator.clipboard?.writeText(String(raw['SENHA-WIFI-5G'] || ''))
                        }
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
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

        <FitAllOnce user={userCoords ?? null} points={points.map((p) => ({ lat: p.lat, lng: p.lng }))} />
      </MapContainer>
    </div>
  );
}
