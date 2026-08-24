import { useCallback, useEffect, useMemo, useState } from "react";
import type { Flash } from "@/core/db";
import { subscribe } from "@/core/events";
import { useIdentity } from "@/core/identity";
import { isLive, listFlashes } from "./api";

export const useFlashes = () => {
  const [flashes, setFlashes] = useState<Flash[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      setFlashes(await listFlashes());
    } catch {
      setError("On n'arrive pas à lire tes flashs pour le moment.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    return subscribe((e) => {
      if (e.type === "flash:published" || e.type === "flash:closed") void reload();
    });
  }, [reload]);

  // Keep countdowns and expiry honest without refetching everything.
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return { flashes, loading, error, reload };
};

/** Splits the feed the way people actually read it. */
export const useFlashFeed = () => {
  const { flashes, loading, error, reload } = useFlashes();
  const { identity } = useIdentity();

  const groups = useMemo(() => {
    const live = flashes.filter((f) => isLive(f));
    const mine = live.filter((f) => f.authorId === identity?.id);
    const others = live.filter((f) => f.authorId !== identity?.id);
    return {
      mine,
      urgent: others.filter((f) => f.urgency === "urgent"),
      around: others.filter((f) => f.urgency !== "urgent"),
      popular: [...others].sort((a, b) => b.replies - a.replies).slice(0, 3),
      liveCount: live.length,
    };
  }, [flashes, identity?.id]);

  return { ...groups, loading, error, reload };
};
