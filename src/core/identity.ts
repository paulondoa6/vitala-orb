import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { db, type Identity } from "./db";
import { createId } from "./ids";
import { emit } from "./events";

const DEVICE_KEY = "vitalio:identity-id";

export const identitySchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, { message: "Au moins 2 lettres" })
    .max(30, { message: "30 caractères maximum" }),
  city: z.string().trim().max(60).optional(),
  avatar: z.string().optional(),
  interests: z.array(z.string()).max(8).default([]),
});

export type IdentityDraft = z.infer<typeof identitySchema>;

const deviceId = (): string => {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = createId();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
};

let cached: Identity | null = null;
const listeners = new Set<(i: Identity | null) => void>();
const notify = () => listeners.forEach((l) => l(cached));

export const loadIdentity = async (): Promise<Identity> => {
  const id = deviceId();
  let row = await db.identities.get(id);
  if (!row) {
    row = { id, interests: [], createdAt: Date.now(), updatedAt: Date.now() };
    await db.identities.put(row);
  }
  cached = row;
  notify();
  return row;
};

export const saveIdentity = async (patch: Partial<Identity>): Promise<Identity> => {
  const current = cached ?? (await loadIdentity());
  const next: Identity = { ...current, ...patch, updatedAt: Date.now() };
  await db.identities.put(next);
  cached = next;
  notify();
  emit({ type: "identity:updated" });
  return next;
};

export const isKnown = (i: Identity | null): boolean => Boolean(i?.firstName);

/* ------------------------------------------------------------------ */
/* ensureIdentity: opens the "how should we call you?" sheet on demand */
/* ------------------------------------------------------------------ */

type Resolver = (name: string | null) => void;
let askHandler: ((reason: string, resolve: Resolver) => void) | null = null;

export const registerIdentityAsker = (
  handler: (reason: string, resolve: Resolver) => void,
) => {
  askHandler = handler;
  return () => {
    askHandler = null;
  };
};

/**
 * Guarantees we know the user's first name before an action runs.
 * `reason` is shown to the user so the request never feels arbitrary.
 */
export const ensureIdentity = async (reason: string): Promise<Identity | null> => {
  const current = cached ?? (await loadIdentity());
  if (isKnown(current)) return current;
  if (!askHandler) return null;
  const name = await new Promise<string | null>((resolve) => askHandler!(reason, resolve));
  if (!name) return null;
  return saveIdentity({ firstName: name });
};

export const useIdentity = () => {
  const [identity, setIdentity] = useState<Identity | null>(cached);

  useEffect(() => {
    listeners.add(setIdentity);
    if (!cached) void loadIdentity();
    else setIdentity(cached);
    return () => {
      listeners.delete(setIdentity);
    };
  }, []);

  const update = useCallback((patch: Partial<Identity>) => saveIdentity(patch), []);

  return { identity, known: isKnown(identity), update, ensureIdentity };
};
