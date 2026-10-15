import { useCallback, useEffect, useState } from "react";
import { subscribe } from "@/core/events";
import { getRadarScreen, type RadarScreenDTO } from "./api";

export const useRadarScreen = () => {
  const [screen, setScreen] = useState<RadarScreenDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = true) => {
    try {
      setError(null);
      setScreen(await getRadarScreen({ refresh }));
    } catch {
      setError("On n'arrive pas à lire ton radar pour le moment.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const onOnline = () => void load();
    window.addEventListener("online", onOnline);
    const off = subscribe((e) => {
      if (e.type === "radar:changed") void load(false);
      if (e.type === "sync:changed") void load(false);
    });
    return () => {
      off();
      window.removeEventListener("online", onOnline);
    };
  }, [load]);

  return { screen, loading, error, reload: () => load(true) };
};
