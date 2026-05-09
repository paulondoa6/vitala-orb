import { get, set, del, keys } from "idb-keyval";

export type SpaceType = "entreprise" | "boutique" | "organisation" | "marque" | "service" | "equipe";

export interface SpaceDraft {
  id: string;
  types: SpaceType[];
  name?: string;
  logo?: string; // base64 data URL
  location?: { label?: string; lat?: number; lng?: number };
  step: 1 | 2;
  updatedAt: number;
}

const DRAFT_KEY = "vitalio:space:draft";

export const loadDraft = (): Promise<SpaceDraft | undefined> => get(DRAFT_KEY);
export const saveDraft = (d: SpaceDraft) => set(DRAFT_KEY, d);
export const clearDraft = () => del(DRAFT_KEY);
export const listSpaces = () => keys();

export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const NAME_REQUIRED_TYPES: SpaceType[] = ["entreprise", "boutique", "marque"];
