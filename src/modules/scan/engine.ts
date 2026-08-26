import type { Boite, Flash, FlashCategory, GeoPoint, Zone } from "@/core/db";
import { distanceM } from "@/core/geo";

export type ScanMode = "urgence" | "proximite" | "zone" | "personnel";

export interface ScanConfig {
  mode: ScanMode;
  radiusM: number;
  categories: FlashCategory[];
  zoneId?: string;
}

export const DEFAULT_CONFIG: ScanConfig = {
  mode: "proximite",
  radiusM: 1500,
  categories: [],
};

export type ResultKind = "flash" | "zone" | "espace";
export type ResultBucket = "meilleur" | "urgence" | "flash" | "recommande" | "zone" | "proximite";

export interface ScanResult {
  id: string;
  kind: ResultKind;
  bucket: ResultBucket;
  title: string;
  subtitle: string;
  score: number;
  distanceM?: number;
  href: string;
  /** Position on the radar, in [-1, 1] on both axes. */
  radar: { x: number; y: number };
}

export interface ScanInput {
  config: ScanConfig;
  origin?: GeoPoint | null;
  flashes: Flash[];
  zones: Zone[];
  espaces: Boite[];
  interests?: string[];
}

const FRESHNESS_WINDOW_MS = 60 * 60 * 1000;

const freshness = (createdAt: number, now: number) =>
  Math.max(0, 1 - (now - createdAt) / FRESHNESS_WINDOW_MS);

const proximity = (d: number | undefined, radiusM: number) => {
  if (d === undefined) return 0.45;
  return Math.max(0, 1 - d / Math.max(radiusM, 1));
};

const radarPoint = (seed: string, distance: number | undefined, radiusM: number) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 100_000;
  const angle = (h / 100_000) * Math.PI * 2;
  const norm =
    distance === undefined ? 0.35 + (h % 40) / 100 : Math.min(0.95, distance / Math.max(radiusM, 1));
  return { x: Math.cos(angle) * norm, y: Math.sin(angle) * norm };
};

const modeWeights = (
  mode: ScanMode,
): { urgency: number; proximity: number; freshness: number; relevance: number } => {
  switch (mode) {
    case "urgence":
      return { urgency: 0.5, proximity: 0.2, freshness: 0.2, relevance: 0.1 };
    case "proximite":
      return { urgency: 0.15, proximity: 0.5, freshness: 0.2, relevance: 0.15 };
    case "zone":
      return { urgency: 0.2, proximity: 0.25, freshness: 0.25, relevance: 0.3 };
    case "personnel":
      return { urgency: 0.15, proximity: 0.2, freshness: 0.2, relevance: 0.45 };
  }
};

/**
 * Pure scoring engine — no React, no I/O, fully testable.
 * Aggregates flashes, zones and espaces, scores them, de-duplicates and ranks.
 */
export const runScan = (input: ScanInput, now = Date.now()): ScanResult[] => {
  const { config, origin, flashes, zones, espaces, interests = [] } = input;
  const w = modeWeights(config.mode);
  const results: ScanResult[] = [];
  const seen = new Set<string>();

  const push = (r: ScanResult) => {
    if (seen.has(r.id)) return;
    seen.add(r.id);
    results.push(r);
  };

  for (const flash of flashes) {
    if (flash.closedAt || flash.expiresAt <= now) continue;
    if (config.categories.length > 0 && !config.categories.includes(flash.category)) continue;
    if (config.mode === "zone" && config.zoneId && flash.zoneId !== config.zoneId) continue;

    const d = origin && flash.position ? distanceM(origin, flash.position) : undefined;
    if (d !== undefined && d > config.radiusM) continue;
    if (config.mode === "urgence" && flash.urgency !== "urgent") continue;

    const relevance = interests.some((i) => flash.text.toLowerCase().includes(i.toLowerCase()))
      ? 1
      : 0.4;
    const score =
      w.urgency * (flash.urgency === "urgent" ? 1 : 0.35) +
      w.proximity * proximity(d, config.radiusM) +
      w.freshness * freshness(flash.createdAt, now) +
      w.relevance * relevance;

    push({
      id: `flash-${flash.id}`,
      kind: "flash",
      bucket: flash.urgency === "urgent" ? "urgence" : "flash",
      title: flash.text,
      subtitle: `${flash.authorName} · ${flash.replies} réponse${flash.replies > 1 ? "s" : ""}`,
      score,
      distanceM: d,
      href: "/flash",
      radar: radarPoint(flash.id, d, config.radiusM),
    });
  }

  for (const zone of zones) {
    if (config.mode === "urgence") continue;
    if (config.mode === "zone" && config.zoneId && zone.id !== config.zoneId) continue;
    const d = origin ? distanceM(origin, zone.center) : undefined;
    const activeHere = flashes.filter(
      (f) => f.zoneId === zone.id && !f.closedAt && f.expiresAt > now,
    ).length;
    const score =
      w.proximity * proximity(d, config.radiusM * 12) +
      w.relevance * Math.min(1, (activeHere + zone.opportunities.length) / 6) +
      0.1;

    push({
      id: `zone-${zone.id}`,
      kind: "zone",
      bucket: "zone",
      title: zone.name,
      subtitle: `${zone.city} · ${activeHere} flash${activeHere > 1 ? "s" : ""} en direct`,
      score,
      distanceM: d,
      href: `/zone/${zone.id}`,
      radar: radarPoint(zone.id, d, config.radiusM * 12),
    });
  }

  for (const espace of espaces) {
    if (config.mode === "urgence") continue;
    const point = espace.location?.lat != null && espace.location?.lng != null
      ? { lat: espace.location.lat, lng: espace.location.lng }
      : undefined;
    const d = origin && point ? distanceM(origin, point) : undefined;
    if (d !== undefined && d > config.radiusM * 6) continue;
    const score =
      w.proximity * proximity(d, config.radiusM * 6) +
      w.relevance * Math.min(1, espace.services.length / 4) +
      0.08;

    push({
      id: `espace-${espace.uuid}`,
      kind: "espace",
      bucket: "recommande",
      title: espace.name ?? "Espace sans nom",
      subtitle: `${espace.services.length} service${espace.services.length > 1 ? "s" : ""} · ${espace.uuid}`,
      score,
      distanceM: d,
      href: `/espace/${espace.uuid}`,
      radar: radarPoint(espace.uuid, d, config.radiusM * 6),
    });
  }

  const ranked = results.sort((a, b) => b.score - a.score);
  if (ranked.length > 0) ranked[0] = { ...ranked[0], bucket: "meilleur" };

  // Anything close but low-scoring still deserves the "juste à côté" bucket.
  return ranked.map((r, i) =>
    i > 0 && r.distanceM !== undefined && r.distanceM < 400 && r.bucket === "flash"
      ? { ...r, bucket: "proximite" }
      : r,
  );
};

export const BUCKETS: { key: ResultBucket; label: string }[] = [
  { key: "meilleur", label: "Le meilleur" },
  { key: "urgence", label: "Urgent" },
  { key: "flash", label: "Flashs" },
  { key: "proximite", label: "Juste à côté" },
  { key: "zone", label: "Zones" },
  { key: "recommande", label: "Espaces" },
];

export const SCAN_MODES: { key: ScanMode; label: string; hint: string }[] = [
  { key: "urgence", label: "Urgence", hint: "Uniquement ce qui ne peut pas attendre" },
  { key: "proximite", label: "À proximité", hint: "Tout ce qui est à quelques minutes" },
  { key: "zone", label: "Zone ciblée", hint: "Je choisis un quartier précis" },
  { key: "personnel", label: "Pour moi", hint: "Selon ce qui t'intéresse" },
];
