import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { db } from "@/core/db";
import { ensureSeeded } from "@/core/seed";
import { getPosition } from "@/core/permissions";
import { useIdentity } from "@/core/identity";
import { track } from "@/core/analytics";
import { runScan, type ScanConfig, type ScanResult } from "./engine";

export type ScanPhase = "idle" | "scanning" | "done";

export interface ScanStep {
  label: string;
  at: number;
}

const stepsFor = (config: ScanConfig): ScanStep[] => [
  { label: "Activation du radar", at: 8 },
  { label: `Balayage sur ${config.radiusM >= 1000 ? `${config.radiusM / 1000} km` : `${config.radiusM} m`}`, at: 32 },
  { label: "Croisement des besoins en cours", at: 58 },
  { label: "Lecture du pouls des zones", at: 78 },
  { label: "Classement des résultats", at: 94 },
];

export const useScanRunner = () => {
  const { identity } = useIdentity();
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<string>("");
  const [results, setResults] = useState<ScanResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const start = useCallback(
    async (config: ScanConfig) => {
      clear();
      setPhase("scanning");
      setProgress(0);
      setResults([]);
      setError(null);
      const startedAt = Date.now();
      track({ name: "scan_started", mode: config.mode, radiusM: config.radiusM });


      const steps = stepsFor(config);
      steps.forEach((s, i) => {
        timers.current.push(
          window.setTimeout(() => {
            setStep(s.label);
            setProgress(s.at);
          }, 260 + i * 480),
        );
      });

      try {
        await ensureSeeded();
        const [origin, flashes, zones, espaces] = await Promise.all([
          getPosition(),
          db.flashes.toArray(),
          db.zones.toArray(),
          db.boites.toArray(),
        ]);
        const found = runScan({
          config,
          origin,
          flashes,
          zones,
          espaces,
          interests: identity?.interests ?? [],
        });

        // Reveal progressively: results land on the radar as they are found.
        found.forEach((r, i) => {
          timers.current.push(
            window.setTimeout(
              () => setResults((prev) => [...prev, r]),
              600 + i * 160,
            ),
          );
        });

        timers.current.push(
          window.setTimeout(() => {
            setProgress(100);
            setStep(
              found.length === 0
                ? "Rien trouvé dans ce périmètre"
                : `${found.length} résultat${found.length > 1 ? "s" : ""} classés`,
            );
            setPhase("done");
          }, 900 + found.length * 160),
        );
      } catch {
        clear();
        setError("Le scan s'est interrompu. Réessaie dans un instant.");
        setPhase("idle");
      }
    },
    [identity?.interests],
  );

  const reset = useCallback(() => {
    clear();
    setPhase("idle");
    setProgress(0);
    setResults([]);
    setStep("");
    setError(null);
  }, []);

  return { phase, progress, step, results, error, start, reset };
};
