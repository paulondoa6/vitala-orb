import { db, type OutboxItem, type OutboxKind, type OutboxStatus } from "@/core/db";
import { createId } from "@/core/ids";
import { emit } from "@/core/events";
import { supabase } from "@/integrations/supabase/client";

/**
 * Phase 9 — Offline-first.
 * Dexie reste la source de lecture ; toute écriture distante passe par cette file.
 * Au retour du réseau (ou à la connexion), la file est rejouée puis réconciliée.
 */

export type { OutboxItem, OutboxKind, OutboxStatus };

const MAX_ATTEMPTS = 5;

export const isOnline = () => (typeof navigator === "undefined" ? true : navigator.onLine !== false);

/** Ajoute une écriture à rejouer plus tard. */
export const enqueue = async (
  kind: OutboxKind,
  refId: string,
  payload: unknown,
): Promise<OutboxItem> => {
  const now = Date.now();
  const item: OutboxItem = {
    id: createId(),
    kind,
    refId,
    payload,
    status: "pending",
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  };
  await db.outbox.put(item);
  emit({ type: "sync:changed" });
  void flushOutbox();
  return item;
};

export const listOutbox = (): Promise<OutboxItem[]> =>
  db.outbox.orderBy("createdAt").toArray();

/** État de synchronisation d'une entité locale, pour l'afficher là où il compte. */
export const getSyncStatus = async (refId: string): Promise<OutboxStatus | "synced"> => {
  const items = await db.outbox.where("refId").equals(refId).toArray();
  if (items.length === 0) return "synced";
  if (items.some((i) => i.status === "failed")) return "failed";
  if (items.some((i) => i.status === "syncing")) return "syncing";
  return "pending";
};

export interface SyncSummary {
  pending: number;
  failed: number;
  synced: number;
}

export const getSyncSummary = async (): Promise<SyncSummary> => {
  const items = await listOutbox();
  return {
    pending: items.filter((i) => i.status === "pending" || i.status === "syncing").length,
    failed: items.filter((i) => i.status === "failed").length,
    synced: items.filter((i) => i.status === "synced").length,
  };
};

/* ------------------------------------------------------------------ */
/* Rejeu : un handler par type d'écriture                              */
/* ------------------------------------------------------------------ */

type Handler = (payload: any, userId: string) => Promise<void>;

const handlers: Record<OutboxKind, Handler> = {
  "flash:create": async (p, userId) => {
    const { error } = await supabase.from("flashes").insert({
      author_id: userId,
      body: p.body,
      category: p.category,
      expires_at: new Date(p.expiresAt).toISOString(),
      lat: p.lat ?? null,
      lng: p.lng ?? null,
    });
    if (error) throw new Error(error.message);
  },
  "flash:close": async (p, userId) => {
    const { error } = await supabase
      .from("flashes")
      .update({ status: "closed" })
      .eq("author_id", userId)
      .eq("id", p.remoteId ?? p.id);
    if (error) throw new Error(error.message);
  },
  "espace:create": async (p, userId) => {
    const { error } = await supabase.from("espaces").insert({
      owner_id: userId,
      public_code: p.publicCode,
      name: p.name,
      type: p.type,
      city: p.city ?? null,
      lat: p.lat ?? null,
      lng: p.lng ?? null,
    });
    if (error) throw new Error(error.message);
  },
};

let flushing = false;

/** Rejoue la file. Sans réseau ni session, on ne touche à rien : tout reste en attente. */
export const flushOutbox = async (): Promise<SyncSummary> => {
  if (flushing || !isOnline()) return getSyncSummary();
  flushing = true;
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) return getSyncSummary();

    const items = (await listOutbox()).filter(
      (i) => i.status === "pending" || i.status === "failed",
    );
    for (const item of items) {
      if (item.attempts >= MAX_ATTEMPTS) continue;
      await db.outbox.update(item.id, { status: "syncing", updatedAt: Date.now() });
      emit({ type: "sync:changed" });
      try {
        await handlers[item.kind](item.payload, userId);
        await db.outbox.delete(item.id);
      } catch (e) {
        await db.outbox.update(item.id, {
          status: "failed",
          attempts: item.attempts + 1,
          lastError: e instanceof Error ? e.message : String(e),
          updatedAt: Date.now(),
        });
      }
      emit({ type: "sync:changed" });
    }
    return getSyncSummary();
  } finally {
    flushing = false;
  }
};

/** Relance manuelle d'une écriture en échec. */
export const retryItem = async (id: string) => {
  await db.outbox.update(id, { status: "pending", attempts: 0, updatedAt: Date.now() });
  emit({ type: "sync:changed" });
  return flushOutbox();
};

export const discardItem = async (id: string) => {
  await db.outbox.delete(id);
  emit({ type: "sync:changed" });
};

let started = false;

/** Branche la réconciliation au retour du réseau et à l'ouverture de l'app. */
export const startSync = () => {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("online", () => void flushOutbox());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void flushOutbox();
  });
  supabase.auth.onAuthStateChange(() => {
    void flushOutbox();
  });
  void flushOutbox();
};
