import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ScanLine, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Phase = "idle" | "scanning" | "result";

const Scan = () => {
  const [phase, setPhase] = useState<Phase>("idle");
  const navigate = useNavigate();

  const start = () => {
    setPhase("scanning");
    setTimeout(() => setPhase("result"), 2800);
  };

  return (
    <AppShell>
      <div className="relative -mx-5 -mt-4 flex h-[calc(100vh-9rem)] flex-col items-center justify-center overflow-hidden">
        {/* Ambient grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage: "radial-gradient(circle at center, black 30%, transparent 75%)",
          }}
        />

        {/* Header text */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 z-10 text-center"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Vitala Scan
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            {phase === "idle" && "Tap to scan"}
            {phase === "scanning" && "Analyzing..."}
            {phase === "result" && "Scan complete"}
          </h2>
        </motion.div>

        {/* Scan core */}
        <div className="relative flex h-[320px] w-[320px] items-center justify-center">
          {/* Static rings */}
          {[0, 1, 2].map((i) => (
            <div
              key={`ring-${i}`}
              className="absolute rounded-full border border-primary/15"
              style={{ width: 120 + i * 70, height: 120 + i * 70 }}
            />
          ))}

          {/* Pulse waves */}
          <AnimatePresence>
            {(phase === "idle" || phase === "scanning") &&
              [0, 1, 2].map((i) => (
                <motion.span
                  key={`pulse-${i}-${phase}`}
                  className="absolute rounded-full border-2 border-primary"
                  initial={{ width: 130, height: 130, opacity: 0.6 }}
                  animate={{
                    width: 300,
                    height: 300,
                    opacity: 0,
                    borderWidth: 1,
                  }}
                  transition={{
                    duration: phase === "scanning" ? 1.4 : 2.4,
                    repeat: Infinity,
                    delay: i * (phase === "scanning" ? 0.45 : 0.8),
                    ease: "easeOut",
                  }}
                />
              ))}
          </AnimatePresence>

          {/* Radar sweep */}
          {phase === "scanning" && (
            <motion.div
              className="absolute h-[260px] w-[260px] rounded-full overflow-hidden"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
            >
              <div
                className="h-full w-full"
                style={{
                  background:
                    "conic-gradient(from 0deg, hsl(var(--primary)/0.55) 0deg, hsl(var(--primary)/0.0) 90deg, transparent 360deg)",
                }}
              />
            </motion.div>
          )}

          {/* Scan dots (radar blips) */}
          {phase === "scanning" &&
            [
              { x: -60, y: -40, d: 0.4 },
              { x: 70, y: -20, d: 0.9 },
              { x: -30, y: 80, d: 1.4 },
              { x: 90, y: 60, d: 1.9 },
            ].map((b, i) => (
              <motion.span
                key={i}
                className="absolute h-1.5 w-1.5 rounded-full bg-primary shadow-glow"
                style={{ x: b.x, y: b.y }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
                transition={{ duration: 1.6, delay: b.d, repeat: Infinity }}
              />
            ))}

          {/* Central button */}
          <motion.button
            type="button"
            onClick={phase === "idle" ? start : undefined}
            disabled={phase !== "idle"}
            whileTap={{ scale: 0.92 }}
            animate={{
              scale: phase === "scanning" ? [1, 1.04, 1] : 1,
            }}
            transition={{
              scale: { duration: 1.4, repeat: phase === "scanning" ? Infinity : 0 },
            }}
            className="relative z-10 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-primary shadow-glow ring-8 ring-background/80"
          >
            <AnimatePresence mode="wait">
              {phase === "result" ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 280, damping: 14 }}
                >
                  <Check className="h-12 w-12 text-primary-foreground" strokeWidth={3} />
                </motion.div>
              ) : (
                <motion.div
                  key="scan"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ScanLine className="h-12 w-12 text-primary-foreground" strokeWidth={2.2} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Bottom slot */}
        <div className="absolute bottom-6 left-0 right-0 z-10 flex flex-col items-center px-6">
          <AnimatePresence mode="wait">
            {phase === "idle" && (
              <motion.p
                key="hint"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-sm text-muted-foreground"
              >
                Hold steady. Point and tap.
              </motion.p>
            )}

            {phase === "scanning" && (
              <motion.div
                key="bar"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-48"
              >
                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-gradient-primary"
                    initial={{ width: "5%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2.6, ease: "easeInOut" }}
                  />
                </div>
                <p className="mt-2 text-center text-[11px] uppercase tracking-widest text-muted-foreground">
                  Reading vitals
                </p>
              </motion.div>
            )}

            {phase === "result" && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
                className="w-full max-w-sm rounded-3xl glass shadow-float p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                      <Sparkles className="h-3 w-3" /> Excellent
                    </div>
                    <p className="mt-1 text-lg font-semibold tracking-tight">
                      Maison Verte
                    </p>
                    <p className="text-xs text-muted-foreground">Restaurant · Bio</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary">94</p>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Indice vital
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setPhase("idle")}
                    className="flex-1 rounded-full bg-secondary py-2.5 text-sm font-medium text-secondary-foreground"
                  >
                    Scan again
                  </button>
                  <button
                    onClick={() => navigate("/")}
                    className="flex-1 rounded-full bg-gradient-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
                  >
                    View details
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
};

export default Scan;
