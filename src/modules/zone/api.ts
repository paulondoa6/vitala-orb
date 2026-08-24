import { db, type Zone, type ZoneMembership } from "@/core/db";
import { createId } from "@/core/ids";
import { emit } from "@/core/events";
import { ensureSeeded } from "@/core/seed";
import { isLive } from "@/modules/flash/api";

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
