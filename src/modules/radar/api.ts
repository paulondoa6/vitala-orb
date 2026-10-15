import { supabase } from "@/integrations/supabase/client";
import { db, type RadarAlert, type RadarWatch } from "@/core/db";
import { timeAgo } from "@/core/geo";
import { emit } from "@/core/events";
import { enqueue } from "@/core/sync";

/**
 * Module Radar — veilles et alertes.
 * Lecture : cache Dexie (offline-first), rafraîchi depuis `radar_watches` / `radar_alerts`.
 * Écriture : locale immédiate + outbox rejouée vers le backend.
 */

export interface RadarWatchDTO {
  id: string;
  label: string;
  categories: string[];
  radiusLabel: string;
  radiusM: number;
  zoneId: string | null;
  active: boolean;
}

export interface RadarAlertDTO {
  id: string;
  title: string;
  ageLabel: string;
  read: boolean;
  href: string | null;
}

export interface RadarScreenDTO {
  watches: RadarWatchDTO[];
  alerts: RadarAlertDTO[];
  unread: number;
  source: "remote" | "local";
}

export const RADAR_RADII = [500, 1000, 3000, 10000];

export const radiusLabel = (m: number) =>
  m < 1000 ? `${m} m autour de moi` : `${(m / 1000).toFixed(m % 1000 ? 1 : 0)} km autour de moi`;

const alertHref = (sourceType: string, sourceId: string | null): string | null => {
  if (!sourceId) return null;
  if (sourceType === "flash") return `/flash/${sourceId}`;
  if (sourceType === "zone") return `/zone/${sourceId}`;
  if (sourceType === "espace") return `/espace/${sourceId}`;
  return null;
};

const toWatchDTO = (w: RadarWatch): RadarWatchDTO => ({
  id: w.id,
  label: w.label,
  categories: w.categories,
  radiusM: w.radiusM,
  radiusLabel: radiusLabel(w.radiusM),
  zoneId: w.zoneId,
  active: w.active,
});

const toAlertDTO = (a: RadarAlert): RadarAlertDTO => ({
  id: a.id,
  title: a.title,
  ageLabel: timeAgo(a.createdAt),
  read: a.read,
  href: alertHref(a.sourceType, a.sourceId),
});

const changed = () => emit({ type: "radar:changed" });

/** Tire l'état serveur dans le cache, sans écraser les écritures locales non synchronisées. */
const pullRemote = async (): Promise<boolean> => {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return false;
  const [w, a, pending] = await Promise.all([
    supabase
      .from("radar_watches")
      .select("id,label,categories,radius_m,zone_id,is_active,created_at,updated_at"),
    supabase
      .from("radar_alerts")
      .select("id,title,source_type,source_id,is_read,created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    db.outbox.where("status").anyOf("pending", "syncing", "failed", "conflict").toArray(),
  ]);
  if (w.error || a.error) throw new Error(w.error?.message ?? a.error?.message);
  const dirty = new Set(pending.filter((p) => p.kind.startsWith("radar:")).map((p) => p.refId));

  await db.transaction("rw", db.radarWatches, db.radarAlerts, async () => {
    const remoteIds = new Set((w.data ?? []).map((r) => r.id));
    const local = await db.radarWatches.toArray();
    // Supprimé côté serveur et rien en attente localement → on retire.
    await db.radarWatches.bulkDelete(
      local.filter((l) => !remoteIds.has(l.id) && !dirty.has(l.id)).map((l) => l.id),
    );
    await db.radarWatches.bulkPut(
      (w.data ?? [])
        .filter((r) => !dirty.has(r.id))
        .map((r) => ({
          id: r.id,
          label: r.label,
          categories: r.categories ?? [],
          radiusM: r.radius_m,
          zoneId: r.zone_id,
          active: r.is_active,
          createdAt: new Date(r.created_at).getTime(),
          updatedAt: new Date(r.updated_at).getTime(),
        })),
    );
    await db.radarAlerts.bulkPut(
      (a.data ?? [])
        .filter((r) => !dirty.has(r.id))
        .map((r) => ({
          id: r.id,
          title: r.title,
          sourceType: r.source_type,
          sourceId: r.source_id,
          read: r.is_read,
          createdAt: new Date(r.created_at).getTime(),
        })),
    );
  });
  return true;
};

const readLocal = async () => {
  const [watches, alerts] = await Promise.all([
    db.radarWatches.orderBy("createdAt").reverse().toArray(),
    db.radarAlerts.orderBy("createdAt").reverse().limit(50).toArray(),
  ]);
  return { watches: watches.map(toWatchDTO), alerts: alerts.map(toAlertDTO) };
};

/** Vue Radar : veilles + alertes, rien d'autre (contrat `radar`). */
export const getRadarScreen = async (opts: { refresh?: boolean } = {}): Promise<RadarScreenDTO> => {
  let source: "remote" | "local" = "local";
  if (opts.refresh !== false) {
    try {
      if (await pullRemote()) source = "remote";
    } catch {
      /* hors ligne ou backend indisponible : cache local */
    }
  }
  const { watches, alerts } = await readLocal();
  return { watches, alerts, unread: alerts.filter((a) => !a.read).length, source };
};

export interface CreateWatchInput {
  label: string;
  categories: string[];
  radiusM: number;
  zoneId?: string | null;
}

const queueUpsert = (w: RadarWatch) =>
  enqueue("radar:watch:upsert", w.id, {
    id: w.id,
    label: w.label,
    categories: w.categories,
    radiusM: w.radiusM,
    zoneId: w.zoneId,
    active: w.active,
  });

export const createWatch = async (input: CreateWatchInput): Promise<RadarWatchDTO> => {
  const label = input.label.trim();
  if (label.length < 2) throw new Error("Donne un nom à ta veille.");
  if (label.length > 60) throw new Error("60 caractères maximum.");
  const now = Date.now();
  const watch: RadarWatch = {
    id: crypto.randomUUID(),
    label,
    categories: input.categories,
    radiusM: input.radiusM,
    zoneId: input.zoneId ?? null,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
  await db.radarWatches.put(watch);
  await queueUpsert(watch);
  changed();
  return toWatchDTO(watch);
};

export const toggleWatch = async (id: string, active: boolean): Promise<void> => {
  const w = await db.radarWatches.get(id);
  if (!w) return;
  const next = { ...w, active, updatedAt: Date.now() };
  await db.radarWatches.put(next);
  await queueUpsert(next);
  changed();
};

export const deleteWatch = async (id: string): Promise<void> => {
  await db.radarWatches.delete(id);
  await enqueue("radar:watch:delete", id, { id });
  changed();
};

export const markAlertRead = async (id: string): Promise<void> => {
  const a = await db.radarAlerts.get(id);
  if (!a || a.read) return;
  await db.radarAlerts.update(id, { read: true });
  await enqueue("radar:alert:read", id, { id });
  changed();
};
