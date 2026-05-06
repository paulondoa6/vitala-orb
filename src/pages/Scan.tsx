import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Compass,
  Flame,
  MapPin,
  RotateCw,
  Sparkles,
  Star,
  Target,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

type Phase = "idle" | "scanning" | "result";

type ResultKind = "best" | "flash" | "urgent" | "need" | "reco" | "near";

interface ScanResult {
  id: string;
  name: string;
  category: string;
  distance: string;
  score: number;
  kind: ResultKind;
  hint: string;
}

const POOL: Omit<ScanResult, "id">[] = [
  { name: "Maison Verte", category: "Restaurant · Bio", distance: "120 m", score: 94, kind: "best", hint: "Meilleur choix autour de vous" },
  { name: "Pharmacie Centrale", category: "Santé · 24/7", distance: "240 m", score: 88, kind: "urgent", hint: "Ouverte maintenant" },
  { name: "Flash · Café Lumen", category: "Offre éclair · -40%", distance: "180 m", score: 82, kind: "flash", hint: "Expire dans 12 min" },
  { name: "Studio Yoga Zen", category: "Bien-être", distance: "350 m", score: 79, kind: "reco", hint: "Recommandé pour vous" },
  { name: "Épicerie du Coin", category: "Courses essentielles", distance: "90 m", score: 76, kind: "need", hint: "Couvre vos besoins" },
  { name: "Parc des Lilas", category: "Espace vert", distance: "410 m", score: 72, kind: "near", hint: "Idéal pour respirer" },
  { name: "Boulangerie Aube", category: "Artisan · Bio", distance: "60 m", score: 85, kind: "near", hint: "Tout près" },
  { name: "Clinique Express", category: "Urgences douces", distance: "520 m", score: 81, kind: "urgent", hint: "File d'attente faible" },
  { name: "Flash · Atelier Vibe", category: "Évent · -25%", distance: "300 m", score: 77, kind: "flash", hint: "Expire dans 28 min" },
  { name: "Marché Local", category: "Producteurs", distance: "470 m", score: 74, kind: "reco", hint: "Recommandé · saison" },
];

const KIND_META: Record<
  ResultKind,
  { label: string; icon: typeof Star; tint: string; ring: string }
> = {
  best: { label: "Meilleur", icon: Star, tint: "text-primary", ring: "ring-primary/40" },
  flash: { label: "Flash", icon: Zap, tint: "text-accent", ring: "ring-accent/40" },
  urgent: { label: "Urgence", icon: AlertTriangle, tint: "text-destructive", ring: "ring-destructive/30" },
  need: { label: "Besoin", icon: Target, tint: "text-foreground", ring: "ring-foreground/20" },
  reco: { label: "Recommandé", icon: Sparkles, tint: "text-primary", ring: "ring-primary/30" },
  near: { label: "Proximité", icon: Compass, tint: "text-muted-foreground", ring: "ring-muted-foreground/20" },
};

const SCAN_DURATION = 4200;

const Scan = () => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [results, setResults] = useState<ScanResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [seed, setSeed] = useState(0);
  const navigate = useNavigate();

  const pool = useMemo(() => {
    const shuffled = [...POOL].sort(() => Math.random() - 0.5);
    return shuffled.map((r, i) => ({ ...r, id: `${seed}-${i}` }));
  }, [seed]);

  const start = () => {
    setResults([]);
    setProgress(0);
    setPhase("scanning");
  };

  useEffect(() => {
    if (phase !== "scanning") return;
    const startTime = performance.now();
    let raf = 0;

    // Reveal results progressively
    const timeouts = pool.map((r, i) =>
      window.setTimeout(() => {
        setResults((prev) => [...prev, r]);
      }, 300 + i * (SCAN_DURATION / (pool.length + 2)))
    );

    const tick = () => {
      const p = Math.min(1, (performance.now() - startTime) / SCAN_DURATION);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setPhase("result");
    };
    raf = requestAnimationFrame(tick);

    return () => {
      timeouts.forEach(clearTimeout);
      cancelAnimationFrame(raf);
    };
  }, [phase, pool]);

  const grouped = useMemo(() => {
    const order: ResultKind[] = ["best", "urgent", "flash", "reco", "need", "near"];
    return order
      .map((kind) => ({ kind, items: results.filter((r) => r.kind === kind) }))
      .filter((g) => g.items.length > 0);
  }, [results]);

  const restart = () => {
    setSeed((s) => s + 1);
    setPhase("idle");
    setResults([]);
    setProgress(0);
  };

  return (
    <AppShell>
      <div className="-mx-5 -mt-4">
        {/* ============ SCAN STAGE ============ */}
        <div className="relative flex h-[360px] items-center justify-center overflow-hidden">
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

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 z-10 px-6 text-center"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Vitala Radar
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              {phase === "idle" && "Lancez le scan"}
              {phase === "scanning" && "Analyse en cours..."}
              {phase === "result" && `${results.length} résultats trouvés`}
            </h2>
          </motion.div>

          {/* Radar core (no central icon) */}
          <div className="relative flex h-[280px] w-[280px] items-center justify-center">
            {/* Static rings */}
            {[0, 1, 2, 3].map((i) => (
              <div
                key={`ring-${i}`}
                className="absolute rounded-full border border-primary/15"
                style={{ width: 80 + i * 60, height: 80 + i * 60 }}
              />
            ))}

            {/* Cross hairs */}
            <div className="absolute h-px w-full bg-primary/10" />
            <div className="absolute h-full w-px bg-primary/10" />

            {/* Pulse waves */}
            {(phase === "idle" || phase === "scanning") &&
              [0, 1, 2].map((i) => (
                <motion.span
                  key={`pulse-${i}-${phase}`}
                  className="absolute rounded-full border-2 border-primary"
                  initial={{ width: 70, height: 70, opacity: 0.55 }}
                  animate={{
                    width: 280,
                    height: 280,
                    opacity: 0,
                    borderWidth: 1,
                  }}
                  transition={{
                    duration: phase === "scanning" ? 1.6 : 2.6,
                    repeat: Infinity,
                    delay: i * (phase === "scanning" ? 0.5 : 0.85),
                    ease: "easeOut",
                  }}
                />
              ))}

            {/* Radar sweep */}
            {phase === "scanning" && (
              <motion.div
                className="absolute h-[260px] w-[260px] overflow-hidden rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
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

            {/* Result blips appearing on radar */}
            <AnimatePresence>
              {results.slice(0, 8).map((r, i) => {
                const angle = (i * 47) % 360;
                const radius = 50 + ((i * 23) % 90);
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;
                return (
                  <motion.span
                    key={r.id}
                    className="absolute h-2 w-2 rounded-full bg-primary shadow-glow"
                    style={{ x, y }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.6, 1], opacity: [0, 1, 0.85] }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                );
              })}
            </AnimatePresence>

            {/* Center dot */}
            <motion.span
              className="absolute h-2.5 w-2.5 rounded-full bg-primary shadow-glow"
              animate={{ scale: phase === "scanning" ? [1, 1.4, 1] : 1 }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          </div>

          {/* Progress bar */}
          {phase === "scanning" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bottom-4 left-1/2 w-56 -translate-x-1/2"
            >
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-gradient-primary"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <p className="mt-2 text-center text-[11px] uppercase tracking-widest text-muted-foreground">
                Lecture des signaux · {Math.round(progress * 100)}%
              </p>
            </motion.div>
          )}
        </div>

        {/* ============ ACTIONS ============ */}
        <div className="mt-2 flex items-center justify-center gap-3 px-5">
          {phase === "idle" && (
            <motion.button
              type="button"
              onClick={start}
              whileTap={{ scale: 0.96 }}
              className="rounded-full bg-gradient-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-glow"
            >
              Démarrer le scan
            </motion.button>
          )}
          {phase === "result" && (
            <motion.button
              type="button"
              onClick={restart}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background"
            >
              <RotateCw className="h-4 w-4" />
              Relancer le scan
            </motion.button>
          )}
          {phase === "scanning" && (
            <p className="text-xs text-muted-foreground">Restez stable, on capte tout autour de vous.</p>
          )}
        </div>

        {/* ============ LIVE STATS ============ */}
        {(phase === "scanning" || phase === "result") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 grid grid-cols-3 gap-2 px-5"
          >
            {[
              { label: "Total", value: results.length, icon: Compass },
              {
                label: "Flash",
                value: results.filter((r) => r.kind === "flash").length,
                icon: Zap,
              },
              {
                label: "Urgences",
                value: results.filter((r) => r.kind === "urgent").length,
                icon: Flame,
              },
            ].map((s) => (
              <div
                key={s.label}
                className="glass rounded-2xl p-3 text-center shadow-float"
              >
                <s.icon className="mx-auto h-3.5 w-3.5 text-muted-foreground" />
                <motion.p
                  key={s.value}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 320, damping: 18 }}
                  className="mt-1 text-xl font-bold tracking-tight"
                >
                  {s.value}
                </motion.p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {s.label}
                </p>
              </div>
            ))}
          </motion.div>
        )}

        {/* ============ RESULTS LIST ============ */}
        <div className="mt-6 space-y-6 px-5">
          <AnimatePresence>
            {grouped.map((group) => {
              const meta = KIND_META[group.kind];
              const Icon = meta.icon;
              return (
                <motion.section
                  key={group.kind}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-4 w-4", meta.tint)} />
                      <h3 className="text-sm font-semibold tracking-tight">
                        {meta.label}
                      </h3>
                    </div>
                    <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                      {group.items.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <AnimatePresence>
                      {group.items.map((item, idx) => (
                        <motion.button
                          key={item.id}
                          type="button"
                          onClick={() => navigate("/")}
                          layout
                          initial={{ opacity: 0, x: -16, scale: 0.96 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: 16 }}
                          transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 22,
                            delay: idx * 0.04,
                          }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            "glass group flex w-full items-center gap-3 rounded-2xl p-3 text-left shadow-float ring-1 ring-transparent transition",
                            group.kind === "best" && "ring-1",
                            meta.ring
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted/60",
                              meta.tint
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold tracking-tight">
                              {item.name}
                            </p>
                            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span className="truncate">{item.category}</span>
                              <span>·</span>
                              <span className="inline-flex items-center gap-0.5">
                                <MapPin className="h-3 w-3" />
                                {item.distance}
                              </span>
                            </div>
                            <p className="mt-1 truncate text-[11px] text-muted-foreground/80">
                              {item.hint}
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={cn(
                                "text-lg font-bold leading-none",
                                item.score >= 85
                                  ? "text-primary"
                                  : item.score >= 75
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              )}
                            >
                              {item.score}
                            </p>
                            <p className="mt-0.5 text-[9px] uppercase tracking-widest text-muted-foreground">
                              /100
                            </p>
                          </div>
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.section>
              );
            })}
          </AnimatePresence>

          {phase === "result" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pt-2 pb-4 text-center text-[11px] uppercase tracking-widest text-muted-foreground"
            >
              Fin des résultats · Relancez pour actualiser
            </motion.div>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default Scan;
