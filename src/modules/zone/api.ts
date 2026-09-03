import { db, type Zone, type ZoneMembership } from "@/core/db";
import { createId } from "@/core/ids";
import { emit } from "@/core/events";
import { ensureSeeded } from "@/core/seed";
import { isLive } from "@/modules/flash/api";
import { fetchZoneList } from "@/core/views";

export interface ZonePulse {
  zone: Zone;
  liveFlashes: number;
  urgentFlashes: number;
  members: number;
  opportunities: number;
  /** 0-100, how alive the zone feels right now. */
  activity: number;
}

export const listZonePulses = async (): Promise<ZonePulse[]> => {
  await ensureSeeded();
  const [zones, flashes, memberships] = await Promise.all([
    db.zones.toArray(),
    db.flashes.toArray(),
    db.zoneMembers.toArray(),
  ]);

  const pulses = zones.map((zone) => {
    const zoneFlashes = flashes.filter((f) => f.zoneId === zone.id && isLive(f));
    const liveFlashes = zoneFlashes.length;
    const urgentFlashes = zoneFlashes.filter((f) => f.urgency === "urgent").length;
    const members = memberships.filter((m) => m.zoneId === zone.id).length;
    const opportunities = zone.opportunities.length;
    const raw = liveFlashes * 14 + urgentFlashes * 12 + members * 8 + opportunities * 10;
    return {
      zone,
      liveFlashes,
      urgentFlashes,
      members,
      opportunities,
      activity: Math.max(6, Math.min(100, raw)),
    };
  });

  return pulses.sort((a, b) => b.activity - a.activity);
};

export const getZonePulse = async (zoneId: string): Promise<ZonePulse | undefined> =>
  (await listZonePulses()).find((p) => p.zone.id === zoneId);

export const listZoneFlashes = async (zoneId: string) => {
  await ensureSeeded();
  const flashes = await db.flashes.where("zoneId").equals(zoneId).toArray();
  return flashes.filter((f) => isLive(f)).sort((a, b) => b.createdAt - a.createdAt);
};

export const isMemberOf = async (zoneId: string, identityId: string): Promise<boolean> =>
  Boolean(
    await db.zoneMembers.where("[zoneId+identityId]").equals([zoneId, identityId]).first(),
  );

export const joinZone = async (zoneId: string, identityId: string): Promise<ZoneMembership> => {
  const existing = await db.zoneMembers
    .where("[zoneId+identityId]")
    .equals([zoneId, identityId])
    .first();
  if (existing) return existing;
  const membership: ZoneMembership = {
    id: createId(),
    zoneId,
    identityId,
    joinedAt: Date.now(),
  };
  await db.zoneMembers.put(membership);
  emit({ type: "zone:joined", zoneId });
  return membership;
};

export const leaveZone = async (zoneId: string, identityId: string) => {
  const existing = await db.zoneMembers
    .where("[zoneId+identityId]")
    .equals([zoneId, identityId])
    .first();
  if (existing) await db.zoneMembers.delete(existing.id);
};

export const activityLabel = (activity: number): string => {
  if (activity >= 70) return "Ça bouge fort";
  if (activity >= 40) return "Bonne activité";
  if (activity >= 20) return "Ça démarre";
  return "Zone calme";
};

/* ------------------------------------------------------------------ */
/* DTO d'écran — Phase 8                                               */
/* ------------------------------------------------------------------ */

export interface ZoneCardDTO {
  id: string;
  name: string;
  city: string;
  activity: number;
  activityLabel: string;
  liveFlashes: number;
  members: number;
}

export interface ZoneScreenDTO {
  source: "remote" | "local";
  zones: ZoneCardDTO[];
}

/** Vue Zone : nom, ville, pouls, flashs actifs (contrat `zone`). */
export const getZoneScreen = async (): Promise<ZoneScreenDTO> => {
  try {
    const rows = await fetchZoneList();
    if (rows.length > 0) {
      return {
        source: "remote",
        zones: rows.map((r) => {
          const activity = Math.max(
            6,
            Math.min(100, r.pulse || r.active_flash_count * 14 + r.member_count * 8),
          );
          return {
            id: r.id,
            name: r.name,
            city: r.city,
            activity,
            activityLabel: activityLabel(activity),
            liveFlashes: r.active_flash_count,
            members: r.member_count,
          };
        }),
      };
    }
  } catch {
    /* on retombe sur le local */
  }

  const pulses = await listZonePulses();
  return {
    source: "local",
    zones: pulses.map((p) => ({
      id: p.zone.id,
      name: p.zone.name,
      city: p.zone.city,
      activity: p.activity,
      activityLabel: activityLabel(p.activity),
      liveFlashes: p.liveFlashes,
      members: p.members,
    })),
  };
};
