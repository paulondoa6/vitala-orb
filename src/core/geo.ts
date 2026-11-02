import type { GeoPoint } from "./db";
import { tc } from "./copy";
import i18n from "./i18n";

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in meters. */
export const distanceM = (a: GeoPoint, b: GeoPoint): number => {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
};

export const formatDistance = (meters: number): string =>
  meters < 950 ? `${Math.round(meters / 10) * 10} m` : `${(meters / 1000).toLocaleString(i18n.resolvedLanguage, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;

export const formatCountdown = (msLeft: number): string => {
  if (msLeft <= 0) return tc("terminé");
  const total = Math.floor(msLeft / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h} h ${String(m).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
};

export const timeAgo = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const min = Math.floor(diff / 60000);
  if (min < 1) return tc("à l'instant");
  if (min < 60) return tc("il y a {{count}} min", { count: min });
  const h = Math.floor(min / 60);
  if (h < 24) return tc("il y a {{count}} h", { count: h });
  return tc("il y a {{count}} j", { count: Math.floor(h / 24) });
};
