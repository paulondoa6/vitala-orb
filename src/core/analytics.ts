/**
 * Lightweight, privacy-friendly analytics.
 * Events stay on the device (ring buffer in localStorage) so the app can
 * show the user what it tracks, and so modules stay independent.
 */

export type AnalyticsEvent =
  | { name: "tab_switch"; from: string | null; to: string }
  | { name: "scan_started"; mode: string; radiusM: number }
  | { name: "scan_completed"; mode: string; results: number; durationMs: number }
  | { name: "scan_failed"; mode: string; reason: string }
  | { name: "profile_updated"; fields: string[] };

export type TrackedEvent = AnalyticsEvent & { at: number };

const KEY = "vitalio:analytics";
const MAX = 200;

const read = (): TrackedEvent[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TrackedEvent[]) : [];
  } catch {
    return [];
  }
};

const listeners = new Set<(events: TrackedEvent[]) => void>();

export const track = (event: AnalyticsEvent) => {
  const entry: TrackedEvent = { ...event, at: Date.now() };
  if (typeof window === "undefined") return entry;
  const next = [...read(), entry].slice(-MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked: analytics must never break the app */
  }
  listeners.forEach((l) => l(next));
  if (import.meta.env.DEV) console.debug("[analytics]", event.name, event);
  return entry;
};

export const getEvents = (): TrackedEvent[] => read();

export const countEvents = (name: AnalyticsEvent["name"]): number =>
  read().filter((e) => e.name === name).length;

export const subscribeAnalytics = (listener: (events: TrackedEvent[]) => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const clearAnalytics = () => {
  localStorage.removeItem(KEY);
  listeners.forEach((l) => l([]));
};
