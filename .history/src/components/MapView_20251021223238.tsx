// MapView.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

export type WifiNetwork = {
  Id: number;
  ['NOME-WIFI']: string;
  ['SENHA-WIFI-2G']: string | null;
  ['SENHA-WIFI-5G']: string | null;
  LATITUDE: string | number;
  LONGITUDE: string | number;
};

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
    points.forEach((p) => bounds.extend([p.lat, p.lng]));
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

/* util simples */
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

type HoverCardState = {
  x: number;
  y: number;
  items: { w: WifiNetwork; marker: L.Marker }[];
} | null;

export default function MapView({
  allWifi = [],
  userCoords,
  onSelectWifi,
  className = '',
  height = '70vh',
}: {
  allWifi: WifiNetwork[];
  userCoords?: { lat: number; lng: number } | null;
  onSelectWifi?: (w: WifiNetwork) => void;
  className?: string;
  height?: string | number;
}) {
  const points = useMemo(() => {
    return allWifi
      .map((w) => ({
        raw: w,
        lat: typeof w.LATITUDE === 'string' ? parseFloat(w.LATITUDE) : (w.LATITUDE as number),
        lng: typeof w.LONGITUDE === 'string' ? parseFloat(w.LONGITUDE) : (w.LONGITUDE as number),
      }))
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  }, [allWifi]);

  const initialCenter = userCoords ?? { lat: -15.78, lng: -47.93 };

  // ---- Hover card de clusters
  const [hoverCard, setHoverCard] = useState<HoverCardState>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => (mouseRef.current = { x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // cluster icon (opcional)
  const iconCreateFunction = (cluster: any) => {
    const count = cluster.getChildCount();
    return L.divIcon({
      html: `<div class="cluster-bubble"><span>${count}</span></div>`,
      className: 'cluster-icon',
      iconSize: L.point(40, 40, true),
    });
  };

  return (
    <div className={className} style={{ width: '100%', position: 'relative' }}>
      {/* HOVER CARD */}
      {hoverCard && (
        <div
          className="cluster-hover-card"
          style={{
            position: 'fixed',
            left: hoverCard.x + 12,
            top: hoverCard.y + 12,
            zIndex: 9999,
            minWidth: 240,
          }}
          onMouseLeave={() => setHoverCard(null)}
        >
          <div className="chc-head">Selecione</div>
          <ul className="chc-list">
            {hoverCard.items.slice(0, 12).map(({ w, marker }) => (
              <li
                key={w.Id}
                className="chc-item"
                  onClick={() => {
                    const m = marker as any;
                    const parent = m.__parent as { spiderfy?: () => void } | undefined;
                    parent?.spiderfy?.();       // <- abre o cluster (spiderfy) corretamente
                    marker.openPopup();
                    onSelectWifi?.(w);
                    setHoverCard(null);
                  }}

              >
                <span className="chc-dot" />
                {w['NOME-WIFI']}
              </li>
            ))}
          </ul>
          {hoverCard.items.length > 12 && (
            <div className="chc-more">+{hoverCard.items.length - 12} outros…</div>
          )}
        </div>
      )}

      <MapContainer
        center={[initialCenter.lat, initialCenter.lng]}
        zoom={13}
        style={{
          width: '100%',
          height,
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,.25)',
        }}
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
          chunkedLoading
          showCoverageOnHover={false}
          spiderfyOnEveryZoom
          iconCreateFunction={iconCreateFunction}
          whenCreated={(clusterGroup) => {
            // eventos de hover do cluster
            clusterGroup.on('clustermouseover', (e: any) => {
              const markers: L.Marker[] = e.layer.getAllChildMarkers();
              const items = markers
                .map((m) => {
                  const w = (m.options as any).__wifi as WifiNetwork | undefined;
                  return w ? { w, marker: m } : null;
                })
                .filter(Boolean) as { w: WifiNetwork; marker: L.Marker }[];
              setHoverCard({
                x: mouseRef.current.x,
                y: mouseRef.current.y,
                items,
              });
            });
            clusterGroup.on('clustermouseout', () => setHoverCard(null));
          }}
        >
          {points.map(({ raw, lat, lng }) => (
            <Marker
              key={raw.Id}
              position={[lat, lng]}
              icon={wifiIcon}
              // injeta o objeto original no options pra recuperar no cluster
              ref={(ref) => {
                if (ref) (ref as any).options.__wifi = raw;
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
                    {Number(lat).toFixed(6)}, {Number(lng).toFixed(6)}
                  </div>

                  <div className="wifi-card__row">
                    <span>2G</span>
                    <div className="wifi-card__value">
                      <code>{raw['SENHA-WIFI-2G'] || '-'}</code>
                      <button
                        type="button"
                        className="wifi-card__btn"
                        disabled={!raw['SENHA-WIFI-2G']}
                        onClick={() => copyToClipboard(String(raw['SENHA-WIFI-2G'] || ''))}
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
                        onClick={() => copyToClipboard(String(raw['SENHA-WIFI-5G'] || ''))}
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

        <FitAllOnce
          user={userCoords ?? null}
          points={points.map((p) => ({ lat: p.lat, lng: p.lng }))}
        />
      </MapContainer>
    </div>
  );
}
