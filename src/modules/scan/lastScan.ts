/**
 * Mémoire du dernier scan — utilisée par le bandeau « reprendre » de Home.
 * Stockage local uniquement : c'est une trace d'usage, pas une donnée métier.
 */

const KEY = "vitala:last-scan";

export interface LastScan {
  at: number;
  results: number;
  mode: string;
}

export const saveLastScan = (value: LastScan) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* stockage indisponible : la trace est optionnelle */
  }
};

export const getLastScan = (): LastScan | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LastScan>;
    if (typeof parsed.at !== "number") return null;
    return {
      at: parsed.at,
      results: typeof parsed.results === "number" ? parsed.results : 0,
      mode: typeof parsed.mode === "string" ? parsed.mode : "scan",
    };
  } catch {
    return null;
  }
};
