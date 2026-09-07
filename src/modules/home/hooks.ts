import { useCallback, useEffect, useState } from "react";
import { useIdentity } from "@/core/identity";
import { subscribe } from "@/core/events";
import { getHomeScreen, type HomeScreenDTO } from "./api";

/** Logique de l'écran Home : aucune donnée n'est chargée dans l'UI. */
export const useHomeScreen = () => {
  const { identity } = useIdentity();
  const viewerId = identity?.id ?? "";
  const [data, setData] = useState<HomeScreenDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await getHomeScreen(viewerId));
    } catch {
      setError("On n'a pas pu charger tes raccourcis.");
    }
  }, [viewerId]);

  useEffect(() => {
    void load();
    return subscribe((event) => {
      if (event.type === "flash:published" || event.type === "flash:closed" || event.type === "espace:created") {
        void load();
      }
    });
  }, [load]);

  return { data, error, reload: load, firstName: identity?.firstName ?? null };
};
