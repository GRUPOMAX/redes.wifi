export type LatLng = { lat: number; lng: number };

const R = 6371e3; // raio em metros

export function haversine(a: LatLng, b: LatLng) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const φ1 = toRad(a.lat),
    φ2 = toRad(b.lat);
  const Δφ = toRad(b.lat - a.lat),
    Δλ = toRad(b.lng - a.lng);
  const s = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const d = 2 * R * Math.asin(Math.sqrt(s));
  return d; // metros
}
