import { useCallback, useEffect, useState } from "react";
import { subscribe } from "@/core/events";
import {
  flushOutbox,
  getSyncStatus,
  getSyncSummary,
  isOnline,
  resolveConflictFor,
  retryFor,
  type SyncSummary,
} from "@/core/sync";
import type { OutboxStatus } from "@/core/db";

/** État de synchronisation global : en attente, en échec, en conflit, hors ligne. */
export const useSync = () => {
  const [summary, setSummary] = useState<SyncSummary>({
    pending: 0,
    failed: 0,
    conflict: 0,
    synced: 0,
  });
  const [online, setOnline] = useState(isOnline());

  const refresh = useCallback(async () => {
    setSummary(await getSyncSummary());
  }, []);

  useEffect(() => {
    void refresh();
    const off = subscribe((e) => {
      if (e.type === "sync:changed") void refresh();
    });
    const on = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", down);
    return () => {
      off();
      window.removeEventListener("online", on);
      window.removeEventListener("offline", down);
    };
  }, [refresh]);

  return { ...summary, online, retryAll: () => flushOutbox().then(setSummary) };
};

/** État de synchronisation d'une seule carte (un flash, un espace). */
export const useEntitySync = (refId: string | undefined) => {
  const [status, setStatus] = useState<OutboxStatus>("synced");

  const refresh = useCallback(async () => {
    if (!refId) return;
    setStatus(await getSyncStatus(refId));
  }, [refId]);

  useEffect(() => {
    void refresh();
    const off = subscribe((e) => {
      if (e.type === "sync:changed") void refresh();
    });
    return off;
  }, [refresh]);

  return {
    status,
    retry: () => (refId ? retryFor(refId) : Promise.resolve()),
    keepMine: () => (refId ? resolveConflictFor(refId, "local") : Promise.resolve()),
    keepServer: () => (refId ? resolveConflictFor(refId, "remote") : Promise.resolve()),
  };
};
