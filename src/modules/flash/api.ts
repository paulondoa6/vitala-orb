import { db, type Flash, type FlashCategory, type FlashUrgency, type GeoPoint } from "@/core/db";
import { createId } from "@/core/ids";
import { emit } from "@/core/events";
import { ensureSeeded } from "@/core/seed";
import { distanceM } from "@/core/geo";

export const FLASH_CATEGORIES: { key: FlashCategory; label: string; emoji: string }[] = [
  { key: "service", label: "Un service", emoji: "🛠" },
  { key: "objet", label: "Un objet", emoji: "📦" },
  { key: "aide", label: "Un coup de main", emoji: "🤝" },
  { key: "transport", label: "Un trajet", emoji: "🚲" },
  { key: "emploi", label: "Du travail", emoji: "💼" },
  { key: "autre", label: "Autre chose", emoji: "✨" },
];

export const FLASH_DURATIONS = [
  { minutes: 15, label: "15 min" },
  { minutes: 60, label: "1 h" },
  { minutes: 240, label: "4 h" },
];

export const categoryLabel = (key: FlashCategory) =>
  FLASH_CATEGORIES.find((c) => c.key === key)?.label ?? "Autre chose";

export interface PublishFlashInput {
  text: string;
  category: FlashCategory;
  durationMinutes: number;
  urgency: FlashUrgency;
  authorId: string;
  authorName: string;
  position?: GeoPoint | null;
  zoneId?: string;
}

export const publishFlash = async (input: PublishFlashInput): Promise<Flash> => {
  const text = input.text.trim();
  if (text.length < 3) throw new Error("Dis-nous en un peu plus (3 caractères minimum).");
  if (text.length > 180) throw new Error("180 caractères maximum, va à l'essentiel.");

  const now = Date.now();
  const flash: Flash = {
    id: createId(),
    authorId: input.authorId,
    authorName: input.authorName,
    text,
    category: input.category,
    urgency: input.urgency,
    zoneId: input.zoneId ?? (input.position ? await nearestZoneId(input.position) : undefined),
    position: input.position ?? undefined,
    createdAt: now,
    expiresAt: now + input.durationMinutes * 60_000,
    replies: 0,
  };
  await db.flashes.put(flash);
  emit({ type: "flash:published", id: flash.id });
  return flash;
};

export const closeFlash = async (id: string) => {
  await db.flashes.update(id, { closedAt: Date.now() });
  emit({ type: "flash:closed", id });
};

export const isLive = (flash: Flash, at = Date.now()) =>
  !flash.closedAt && flash.expiresAt > at;

export const listFlashes = async (): Promise<Flash[]> => {
  await ensureSeeded();
  const all = await db.flashes.toArray();
  return all.sort((a, b) => b.createdAt - a.createdAt);
};

export const listLiveFlashes = async (): Promise<Flash[]> =>
  (await listFlashes()).filter((f) => isLive(f));

export const countLiveFlashes = async (): Promise<number> =>
  (await listLiveFlashes()).length;

const nearestZoneId = async (point: GeoPoint): Promise<string | undefined> => {
  await ensureSeeded();
  const zones = await db.zones.toArray();
  let best: { id: string; d: number } | undefined;
  for (const zone of zones) {
    const d = distanceM(point, zone.center);
    if (!best || d < best.d) best = { id: zone.id, d };
  }
  return best && best.d < 25_000 ? best.id : undefined;
};
