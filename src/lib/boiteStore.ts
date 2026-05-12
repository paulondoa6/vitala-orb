import Dexie, { type Table } from "dexie";
import { customAlphabet } from "nanoid";
import type { SpaceType } from "./spaceStore";

export type MemberRole = "admin" | "moderator";

export interface Service {
  id: string;
  name: string;
  description?: string;
}

export interface Member {
  id: string;
  email: string;
  role: MemberRole;
  invitedAt: number;
}

export interface Boite {
  uuid: string; // 6-char public id
  ownerGoogleId: string;
  types: SpaceType[];
  name?: string;
  logo?: string;
  location?: { label?: string; lat?: number; lng?: number };
  services: Service[];
  members: Member[];
  createdAt: number;
  updatedAt: number;
}

class VitalioDB extends Dexie {
  boites!: Table<Boite, string>;
  constructor() {
    super("vitalio");
    this.version(1).stores({
      boites: "uuid, ownerGoogleId, name, createdAt",
    });
  }
}

export const db = new VitalioDB();

// Crockford-style alphabet (no confusing chars), 6 chars → ~1B combos
const nano = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);
export const generateBoiteUuid = () => nano();

const UUID_RE = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;
export const isValidBoiteUuid = (v: string): boolean => UUID_RE.test(v);

export const generateShareLink = (uuid: string) =>
  `${typeof window !== "undefined" ? window.location.origin : "https://tonapp.com"}/espace/${uuid}`;

export const getCurrentOwnerId = (): string => {
  const KEY = "vitalio:ownerId";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = `local_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
};

export type CreateBoiteStep =
  | { key: "validate"; label: string; progress: number }
  | { key: "uuid"; label: string; progress: number }
  | { key: "prepare"; label: string; progress: number }
  | { key: "persist"; label: string; progress: number }
  | { key: "verify"; label: string; progress: number }
  | { key: "done"; label: string; progress: number };

export const createBoite = async (
  input: Omit<Boite, "uuid" | "createdAt" | "updatedAt" | "ownerGoogleId">,
  onProgress?: (s: CreateBoiteStep) => void,
) => {
  onProgress?.({ key: "validate", label: "Validation des champs…", progress: 10 });
  if (!input.types || input.types.length === 0) {
    throw new Error("Au moins un type d'espace est requis");
  }

  onProgress?.({ key: "uuid", label: "Génération du numéro unique…", progress: 25 });
  let uuid = generateBoiteUuid();
  // Avoid (extremely rare) collisions
  for (let i = 0; i < 5 && (await db.boites.get(uuid)); i++) uuid = generateBoiteUuid();

  onProgress?.({ key: "prepare", label: "Préparation de l'enregistrement…", progress: 45 });
  const now = Date.now();
  const boite: Boite = {
    ...input,
    uuid,
    ownerGoogleId: getCurrentOwnerId(),
    createdAt: now,
    updatedAt: now,
  };

  onProgress?.({ key: "persist", label: "Sauvegarde dans la base locale…", progress: 70 });
  await db.boites.add(boite);

  onProgress?.({ key: "verify", label: "Vérification de l'enregistrement…", progress: 90 });
  const persisted = await db.boites.get(uuid);
  if (!persisted) throw new Error("Échec de vérification après sauvegarde");

  onProgress?.({ key: "done", label: "Espace créée !", progress: 100 });
  return persisted;
};

export const getBoite = (uuid: string) => db.boites.get(uuid);
