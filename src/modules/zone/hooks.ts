import { useCallback, useEffect, useState } from "react";
import { subscribe } from "@/core/events";
import { useIdentity } from "@/core/identity";
import type { Flash } from "@/core/db";
import {
  getZonePulse,
  isMemberOf,
  listZoneFlashes,
  listZonePulses,
  type ZonePulse,
} from "./api";

export const useZonePulses = () => {
  const [pulses, setPulses] = useState<ZonePulse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      setPulses(await listZonePulses());
    } catch {
      setError("On n'arrive pas à charger les zones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    return subscribe((e) => {
      if (e.type === "zone:joined" || e.type === "flash:published" || e.type === "flash:closed") {
        void reload();
      }
    });
  }, [reload]);

  return { pulses, loading, error, reload };
};

export const useZoneDetail = (zoneId?: string) => {
  const { identity } = useIdentity();
  const [pulse, setPulse] = useState<ZonePulse | null>(null);
  const [flashes, setFlashes] = useState<Flash[]>([]);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!zoneId) return;
    try {
      setError(null);
      const [p, f] = await Promise.all([getZonePulse(zoneId), listZoneFlashes(zoneId)]);
      if (!p) {
        setError("Cette zone n'existe pas ou plus.");
        setPulse(null);
      } else {
        setPulse(p);
        setFlashes(f);
      }
      setJoined(identity ? await isMemberOf(zoneId, identity.id) : false);
    } catch {
      setError("Chargement de la zone impossible.");
    } finally {
      setLoading(false);
    }
  }, [zoneId, identity]);

  useEffect(() => {
    void reload();
    return subscribe((e) => {
      if (e.type === "zone:joined" || e.type === "flash:published") void reload();
    });
  }, [reload]);

  return { pulse, flashes, joined, loading, error, reload, setJoined };
};
