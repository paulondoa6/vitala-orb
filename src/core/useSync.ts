import { useCallback, useEffect, useState } from "react";
import { subscribe } from "@/core/events";
import { flushOutbox, getSyncSummary, isOnline, type SyncSummary } from "@/core/sync";

/** État de synchronisation global : en attente, en échec, hors ligne. */
export const useSync = () => {
  const [summary, setSummary] = useState<SyncSummary>({ pending: 0, failed: 0, synced: 0 });
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
