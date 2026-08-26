import { motion } from "framer-motion";
import { useReducedMotion } from "framer-motion";
import type { ScanResult } from "../engine";
import { cn } from "@/lib/utils";

interface Props {
  active: boolean;
  results: ScanResult[];
  progress: number;
}

export const Radar = ({ active, results, progress }: Props) => {
  const reduced = useReducedMotion();

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[280px]">
      {/* range rings */}
      {[1, 0.72, 0.44].map((scale, i) => (
        <div
          key={i}
          aria-hidden
          className="absolute inset-0 rounded-full border border-primary/20"
          style={{ transform: `scale(${scale})` }}
        />
      ))}
      <div aria-hidden className="absolute inset-0 rounded-full bg-primary/5 backdrop-blur-sm" />
      <div aria-hidden className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-primary/10" />
      <div aria-hidden className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-primary/10" />

      {/* sweep */}
      {active && !reduced && (
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, hsl(var(--primary) / 0.35), transparent 28%, transparent 100%)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* expanding waves */}
      {active &&
        !reduced &&
        [0, 0.8, 1.6].map((delay) => (
          <motion.div
            key={delay}
            aria-hidden
            className="absolute inset-0 rounded-full border border-primary/40"
            initial={{ scale: 0.3, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 0 }}
            transition={{ duration: 2.4, repeat: Infinity, delay, ease: "easeOut" }}
          />
        ))}

      {/* blips */}
      {results.map((r) => (
        <motion.span
          key={r.id}
          aria-hidden
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 20 }}
          className={cn(
            "absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full",
            r.bucket === "urgence"
              ? "bg-destructive shadow-[0_0_10px_hsl(var(--destructive))]"
              : r.bucket === "meilleur"
                ? "h-3 w-3 bg-primary shadow-glow"
                : "bg-primary/70",
          )}
          style={{
            left: `${50 + r.radar.x * 46}%`,
            top: `${50 + r.radar.y * 46}%`,
          }}
        />
      ))}

      {/* center */}
      <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full glass shadow-glow">
        <span className="text-sm font-semibold tabular-nums text-primary">
          {active || progress === 100 ? `${progress}%` : "GO"}
        </span>
      </div>
    </div>
  );
};
