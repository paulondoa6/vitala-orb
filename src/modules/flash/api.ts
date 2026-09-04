import { db, type Flash, type FlashCategory, type FlashUrgency, type GeoPoint } from "@/core/db";
import { createId } from "@/core/ids";
import { emit } from "@/core/events";
import { ensureSeeded } from "@/core/seed";
import { distanceM, formatDistance, timeAgo } from "@/core/geo";
import { fetchFlashFeed } from "@/core/views";
import { enqueue } from "@/core/sync";


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

/* ------------------------------------------------------------------ */
/* DTO d'écran — Phase 8 : le backend réel d'abord, le local en secours */
/* ------------------------------------------------------------------ */

export interface FlashCardDTO {
  id: string;
  text: string;
  category: FlashCategory;
  categoryLabel: string;
  authorName: string;
  ageLabel: string;
  distanceLabel: string | null;
  replies: number;
  live: boolean;
  expiresAt: number;
  mine: boolean;
}

export interface FlashScreenDTO {
  source: "remote" | "local";
  mine: FlashCardDTO[];
  around: FlashCardDTO[];
}

const asCategory = (value: string): FlashCategory =>
  (FLASH_CATEGORIES.some((c) => c.key === value) ? value : "autre") as FlashCategory;

const toCard = (
  base: {
    id: string;
    text: string;
    category: FlashCategory;
    authorName: string;
    createdAt: number;
    expiresAt: number;
    replies: number;
    position?: GeoPoint | null;
    mine: boolean;
    closed?: boolean;
  },
  here?: GeoPoint | null,
): FlashCardDTO => ({
  id: base.id,
  text: base.text,
  category: base.category,
  categoryLabel: categoryLabel(base.category),
  authorName: base.authorName,
  ageLabel: timeAgo(base.createdAt),
  distanceLabel:
    here && base.position ? formatDistance(distanceM(here, base.position)) : null,
  replies: base.replies,
  live: !base.closed && base.expiresAt > Date.now(),
  expiresAt: base.expiresAt,
  mine: base.mine,
});

/** Vue Flash : uniquement ce que l'écran Flash affiche (contrat `flash`). */
export const getFlashScreen = async (
  viewerId: string,
  here?: GeoPoint | null,
): Promise<FlashScreenDTO> => {
  let cards: FlashCardDTO[] | null = null;
  let source: "remote" | "local" = "local";

  try {
    const rows = await fetchFlashFeed();
    if (rows.length > 0) {
      source = "remote";
      cards = rows.map((r) =>
        toCard(
          {
            id: r.id,
            text: r.body,
            category: asCategory(r.category),
            authorName: r.author_first_name ?? "Voisin",
            createdAt: new Date(r.created_at).getTime(),
            expiresAt: new Date(r.expires_at).getTime(),
            replies: r.reply_count,
            position: r.lat != null && r.lng != null ? { lat: r.lat, lng: r.lng } : null,
            mine: r.author_id === viewerId,
          },
          here,
        ),
      );
    }
  } catch {
    cards = null;
  }

  if (!cards) {
    const local = await listFlashes();
    cards = local.map((f) =>
      toCard(
        {
          id: f.id,
          text: f.text,
          category: f.category,
          authorName: f.authorName,
          createdAt: f.createdAt,
          expiresAt: f.expiresAt,
          replies: f.replies,
          position: f.position ?? null,
          mine: f.authorId === viewerId,
          closed: Boolean(f.closedAt),
        },
        here,
      ),
    );
  }

  return {
    source,
    mine: cards.filter((c) => c.mine && c.live),
    around: cards.filter((c) => !c.mine && c.live),
  };
};
