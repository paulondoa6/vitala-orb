import Dexie, { type Table } from "dexie";

/** Local-first database. Single source of truth for the whole app. */

export type SpaceType =
  | "produits"
  | "trust"
  | "marque"
  | "service";

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

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Boite {
  uuid: string;
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

/** The person using the app. Filled in progressively, never all at once. */
export interface Identity {
  id: string;
  firstName?: string;
  city?: string;
  avatar?: string;
  interests: string[];
  createdAt: number;
  updatedAt: number;
}

export type FlashCategory =
  | "service"
  | "objet"
  | "aide"
  | "transport"
  | "emploi"
  | "autre";

export type FlashUrgency = "normal" | "urgent";

export interface Flash {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  category: FlashCategory;
  urgency: FlashUrgency;
  zoneId?: string;
  position?: GeoPoint;
  createdAt: number;
  expiresAt: number;
  closedAt?: number;
  replies: number;
}

export interface Zone {
  id: string;
  name: string;
  city: string;
  description: string;
  center: GeoPoint;
  radiusM: number;
  tags: string[];
  opportunities: { id: string; title: string; detail: string }[];
}

export interface ZoneMembership {
  id: string;
  zoneId: string;
  identityId: string;
  joinedAt: number;
}

/** File d'attente d'écritures — Phase 9 (offline-first). */
export type OutboxKind = "flash:create" | "flash:close" | "espace:create";
export type OutboxStatus = "pending" | "syncing" | "synced" | "failed";

export interface OutboxItem {
  id: string;
  kind: OutboxKind;
  /** Identifiant local de l'entité concernée (flash.id, boite.uuid…). */
  refId: string;
  payload: unknown;
  status: OutboxStatus;
  attempts: number;
  lastError?: string;
  createdAt: number;
  updatedAt: number;
}

class VitalioDB extends Dexie {
  boites!: Table<Boite, string>;
  identities!: Table<Identity, string>;
  flashes!: Table<Flash, string>;
  zones!: Table<Zone, string>;
  zoneMembers!: Table<ZoneMembership, string>;
  outbox!: Table<OutboxItem, string>;

  constructor() {
    super("vitalio");
    this.version(1).stores({
      boites: "uuid, ownerGoogleId, name, createdAt",
    });
    this.version(2).stores({
      boites: "uuid, ownerGoogleId, name, createdAt",
      identities: "id, updatedAt",
      flashes: "id, authorId, category, zoneId, expiresAt, createdAt",
      zones: "id, city",
      zoneMembers: "id, zoneId, identityId, [zoneId+identityId]",
    });
    this.version(3).stores({
      outbox: "id, status, kind, refId, createdAt",
    });
  }
}

export const db = new VitalioDB();

