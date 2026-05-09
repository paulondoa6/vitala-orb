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

export const createBoite = async (input: Omit<Boite, "uuid" | "createdAt" | "updatedAt" | "ownerGoogleId">) => {
  const uuid = generateBoiteUuid();
  const now = Date.now();
  const boite: Boite = {
    ...input,
    uuid,
    ownerGoogleId: getCurrentOwnerId(),
    createdAt: now,
    updatedAt: now,
  };
  await db.boites.add(boite);
  return boite;
};

export const getBoite = (uuid: string) => db.boites.get(uuid);
