import { db, type Boite, type Service, type Member, type MemberRole, type SpaceType } from "@/core/db";
import { createPublicCode, isPublicCode } from "@/core/ids";
import { emit } from "@/core/events";
import { fetchPublicEspaces } from "@/core/views";

export type { Boite, Service, Member, MemberRole, SpaceType };

export const generateBoiteUuid = () => createPublicCode();
export const isValidBoiteUuid = (v: string): boolean => isPublicCode(v);

export const generateShareLink = (uuid: string) =>
  `${typeof window !== "undefined" ? window.location.origin : "https://vitalio.app"}/espace/${uuid}`;

export const getCurrentOwnerId = (): string => {
  const KEY = "vitalio:ownerId";
  if (typeof window === "undefined") return "server";
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
): Promise<Boite> => {
  onProgress?.({ key: "validate", label: "On vérifie tes infos…", progress: 10 });
  if (!input.types || input.types.length === 0) {
    throw new Error("Choisis au moins un type d'espace");
  }

  onProgress?.({ key: "uuid", label: "Création de ton code unique…", progress: 25 });
  let uuid = generateBoiteUuid();
  for (let i = 0; i < 5 && (await db.boites.get(uuid)); i++) uuid = generateBoiteUuid();

  onProgress?.({ key: "prepare", label: "Préparation de ton espace…", progress: 45 });
  const now = Date.now();
  const boite: Boite = {
    ...input,
    uuid,
    ownerGoogleId: getCurrentOwnerId(),
    createdAt: now,
    updatedAt: now,
  };

  onProgress?.({ key: "persist", label: "Enregistrement…", progress: 70 });
  await db.boites.add(boite);

  onProgress?.({ key: "verify", label: "Dernière vérification…", progress: 90 });
  const persisted = await db.boites.get(uuid);
  if (!persisted) throw new Error("L'enregistrement n'a pas pu être confirmé");

  onProgress?.({ key: "done", label: "Ton espace est prêt !", progress: 100 });
  emit({ type: "espace:created", uuid });
  return persisted;
};

export const getBoite = async (uuid: string): Promise<Boite | undefined> => db.boites.get(uuid);

export const listBoitesByOwner = async (ownerGoogleId: string): Promise<Boite[]> =>
  db.boites.where("ownerGoogleId").equals(ownerGoogleId).reverse().sortBy("updatedAt");

export const countBoites = async (): Promise<number> => db.boites.count();

/* ------------------------------------------------------------------ */
/* DTO d'écran — Phase 8                                               */
/* ------------------------------------------------------------------ */

export interface EspaceCardDTO {
  code: string;
  name: string;
  typeLabel: string;
  city: string | null;
  serviceCount: number;
  href: string;
}

export interface EspaceScreenDTO {
  source: "remote" | "local";
  mine: EspaceCardDTO[];
  discover: EspaceCardDTO[];
}

const SPACE_TYPE_LABELS: Record<string, string> = {
  entreprise: "Entreprise",
  boutique: "Boutique",
  organisation: "Organisation",
  marque: "Marque",
  service: "Service",
  equipe: "Équipe",
};

export const spaceTypeLabel = (type: string) => SPACE_TYPE_LABELS[type] ?? "Espace";

/** Vue Espace : mes espaces + espaces publics à découvrir (contrat `espace`). */
export const getEspaceScreen = async (): Promise<EspaceScreenDTO> => {
  const local = await listBoitesByOwner(getCurrentOwnerId());
  const mine: EspaceCardDTO[] = local.map((b) => ({
    code: b.uuid,
    name: b.name?.trim() || "Espace sans nom",
    typeLabel: spaceTypeLabel(b.types[0] ?? "service"),
    city: b.location?.label ?? null,
    serviceCount: b.services.length,
    href: `/espace/${b.uuid}`,
  }));

  try {
    const rows = await fetchPublicEspaces();
    return {
      source: rows.length > 0 ? "remote" : "local",
      mine,
      discover: rows
        .filter((r) => !mine.some((m) => m.code === r.public_code))
        .map((r) => ({
          code: r.public_code,
          name: r.name,
          typeLabel: spaceTypeLabel(r.type),
          city: r.city,
          serviceCount: r.service_count,
          href: `/espace/${r.public_code}`,
        })),
    };
  } catch {
    return { source: "local", mine, discover: [] };
  }
};
