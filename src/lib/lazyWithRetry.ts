import { lazy, type ComponentType } from "react";

const RELOAD_KEY = "vitalio:chunk-reloaded";

/**
 * After a new deploy, previously loaded pages point at chunk file names that no
 * longer exist, so `import()` throws "Failed to fetch dynamically imported module"
 * and the screen goes blank. Retry once, then hard-reload the app a single time.
 */
export const lazyWithRetry = <T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) =>
  lazy(async () => {
    try {
      const mod = await factory();
      sessionStorage.removeItem(RELOAD_KEY);
      return mod;
    } catch (error) {
      try {
        return await factory();
      } catch {
        if (sessionStorage.getItem(RELOAD_KEY) !== "1") {
          sessionStorage.setItem(RELOAD_KEY, "1");
          window.location.reload();
          return new Promise<{ default: T }>(() => {});
        }
        throw error;
      }
    }
  });
