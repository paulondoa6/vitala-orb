import { db, type OutboxItem, type OutboxKind, type OutboxStatus } from "@/core/db";
import { createId } from "@/core/ids";
import { emit } from "@/core/events";
import { supabase } from "@/integrations/supabase/client";

/**
 * Phase 9/10 — Offline-first + conflits.
 * Dexie reste la source de lecture ; toute écriture distante passe par cette file.
 * Chaque écriture porte son horodatage local : si le serveur a bougé depuis,
 * l'élément passe en `conflict` et attend une décision explicite.
 */

export type { OutboxItem, OutboxKind, OutboxStatus };

const MAX_ATTEMPTS = 5;

export const isOnline = () => (typeof navigator === "undefined" ? true : navigator.onLine !== false);

/** Le serveur a changé après notre écriture locale : on ne l'écrase pas en silence. */
export class ConflictError extends Error {
  remoteUpdatedAt: number;
  constructor(message: string, remoteUpdatedAt: number) {
    super(message);
    this.name = "ConflictError";
    this.remoteUpdatedAt = remoteUpdatedAt;
  }
}

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
    clientUpdatedAt: now,
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
export const getSyncStatus = async (refId: string): Promise<OutboxStatus> => {
  const items = await db.outbox.where("refId").equals(refId).toArray();
  if (items.length === 0) return "synced";
  if (items.some((i) => i.status === "conflict")) return "conflict";
  if (items.some((i) => i.status === "failed")) return "failed";
  if (items.some((i) => i.status === "syncing")) return "syncing";
  return "pending";
};

export const listConflicts = async (): Promise<OutboxItem[]> =>
  (await listOutbox()).filter((i) => i.status === "conflict");

export interface SyncSummary {
  pending: number;
  failed: number;
  conflict: number;
  synced: number;
}

export const getSyncSummary = async (): Promise<SyncSummary> => {
  const items = await listOutbox();
  return {
    pending: items.filter((i) => i.status === "pending" || i.status === "syncing").length,
    failed: items.filter((i) => i.status === "failed").length,
    conflict: items.filter((i) => i.status === "conflict").length,
    synced: items.filter((i) => i.status === "synced").length,
  };
};

/* ------------------------------------------------------------------ */
/* Rejeu : un handler par type d'écriture                              */
/* ------------------------------------------------------------------ */

type Handler = (payload: any, userId: string, item: OutboxItem) => Promise<void>;

const ms = (iso?: string | null) => (iso ? new Date(iso).getTime() : 0);

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
  "flash:close": async (p, userId, item) => {
    const targetId = p.remoteId ?? p.id;
    const { data: remote } = await supabase
      .from("flashes")
      .select("id, status, updated_at")
      .eq("author_id", userId)
      .eq("id", targetId)
      .maybeSingle();

    if (remote) {
      const remoteAt = ms(remote.updated_at);
      // Le serveur a bougé après notre clôture locale : on demande une décision.
      if (remoteAt > item.clientUpdatedAt && remote.status !== "closed") {
        throw new ConflictError("Ce flash a été modifié ailleurs entre-temps.", remoteAt);
      }
      if (remote.status === "closed") return; // déjà appliqué : rien à faire
    }

    const { error } = await supabase
      .from("flashes")
      .update({ status: "closed" })
      .eq("author_id", userId)
      .eq("id", targetId);
    if (error) throw new Error(error.message);
  },
  "espace:create": async (p, userId, item) => {
    const { data: existing } = await supabase
      .from("espaces")
      .select("public_code, owner_id, updated_at")
      .eq("public_code", p.publicCode)
      .maybeSingle();

    if (existing) {
      if (existing.owner_id === userId) return; // déjà créé, rejeu idempotent
      throw new ConflictError(
        "Ce code d'espace est déjà pris par quelqu'un d'autre.",
        ms(existing.updated_at) || item.clientUpdatedAt,
      );
    }

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
        await handlers[item.kind](item.payload, userId, item);
        await db.outbox.delete(item.id);
      } catch (e) {
        if (e instanceof ConflictError) {
          await db.outbox.update(item.id, {
            status: "conflict",
            lastError: e.message,
            remoteUpdatedAt: e.remoteUpdatedAt,
            updatedAt: Date.now(),
          });
        } else {
          await db.outbox.update(item.id, {
            status: "failed",
            attempts: item.attempts + 1,
            lastError: e instanceof Error ? e.message : String(e),
            updatedAt: Date.now(),
          });
        }
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

/**
 * Résolution de conflit explicite.
 * `local` : ma version repart et écrase le serveur. `remote` : j'abandonne ma version.
 */
export const resolveConflict = async (id: string, keep: "local" | "remote") => {
  if (keep === "remote") return discardItem(id);
  await db.outbox.update(id, {
    status: "pending",
    attempts: 0,
    clientUpdatedAt: Date.now(),
    lastError: undefined,
    updatedAt: Date.now(),
  });
  emit({ type: "sync:changed" });
  return flushOutbox();
};

/** Résolution par entité (une carte Flash ou Espace peut porter plusieurs écritures). */
export const resolveConflictFor = async (refId: string, keep: "local" | "remote") => {
  const items = await db.outbox.where("refId").equals(refId).toArray();
  for (const item of items.filter((i) => i.status === "conflict")) {
    await resolveConflict(item.id, keep);
  }
};

export const retryFor = async (refId: string) => {
  const items = await db.outbox.where("refId").equals(refId).toArray();
  for (const item of items.filter((i) => i.status === "failed")) {
    await retryItem(item.id);
  }
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
