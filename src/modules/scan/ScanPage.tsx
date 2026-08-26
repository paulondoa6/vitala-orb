import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Radar as RadarIcon, RotateCcw, Sliders } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState, ErrorState, PageHeader, SectionLabel } from "@/components/layout/PageScaffold";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistance } from "@/core/geo";
import { FLASH_CATEGORIES } from "@/modules/flash/api";
import { useZonePulses } from "@/modules/zone/hooks";
import { Radar } from "./components/Radar";
import { useScanRunner } from "./hooks";
import {
  BUCKETS,
  DEFAULT_CONFIG,
  SCAN_MODES,
  type ResultBucket,
  type ScanConfig,
} from "./engine";
import type { FlashCategory } from "@/core/db";

const RADII = [500, 1500, 5000];

const ScanPage = () => {
  const [config, setConfig] = useState<ScanConfig>(DEFAULT_CONFIG);
  const [filters, setFilters] = useState<Set<ResultBucket>>(new Set());
  const { pulses } = useZonePulses();
  const { phase, progress, step, results, error, start, reset } = useScanRunner();

  const visible = useMemo(
    () => (filters.size === 0 ? results : results.filter((r) => filters.has(r.bucket))),
    [results, filters],
  );

  const grouped = useMemo(() => {
    return BUCKETS.map((b) => ({
      ...b,
      items: visible.filter((r) => r.bucket === b.key),
    })).filter((g) => g.items.length > 0);
  }, [visible]);

  const toggleFilter = (key: ResultBucket) =>
    setFilters((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const toggleCategory = (key: FlashCategory) =>
    setConfig((c) => ({
      ...c,
      categories: c.categories.includes(key)
        ? c.categories.filter((k) => k !== key)
        : [...c.categories, key],
    }));

  return (
    <AppShell>
      <PageHeader
        eyebrow="Scan"
        title={
          <>
            Regarde <span className="italic font-normal text-primary">autour de toi</span>
          </>
        }
        subtitle="Dis-nous ce que tu cherches, on balaie le quartier et on classe ce qui compte."
      />

      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.section
            key="config"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass shadow-float mt-5 rounded-3xl p-4"
            aria-label="Configuration du scan"
          >
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Sliders className="h-3.5 w-3.5" /> Ce que tu cherches
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {SCAN_MODES.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setConfig((c) => ({ ...c, mode: m.key }))}
                  aria-pressed={config.mode === m.key}
                  className={cn(
                    "rounded-2xl px-3 py-2.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    config.mode === m.key
                      ? "bg-primary/12 ring-1 ring-primary/40"
                      : "bg-secondary/70 hover:bg-secondary",
                  )}
                >
                  <span className="block text-sm font-medium">{m.label}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                    {m.hint}
                  </span>
                </button>
              ))}
            </div>

            {config.mode === "zone" && (
              <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {pulses.map((p) => (
                  <button
                    key={p.zone.id}
                    type="button"
                    onClick={() => setConfig((c) => ({ ...c, zoneId: p.zone.id }))}
                    aria-pressed={config.zoneId === p.zone.id}
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                      config.zoneId === p.zone.id
                        ? "bg-gradient-primary text-primary-foreground shadow-glow"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {p.zone.name}
                  </button>
                ))}
              </div>
            )}

            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Jusqu'où on regarde
            </p>
            <div className="mt-2 flex gap-1.5">
              {RADII.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setConfig((c) => ({ ...c, radiusM: r }))}
                  aria-pressed={config.radiusM === r}
                  className={cn(
                    "flex-1 rounded-xl py-2 text-xs font-medium transition-colors",
                    config.radiusM === r
                      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                      : "bg-secondary/70 text-muted-foreground",
                  )}
                >
                  {r >= 1000 ? `${r / 1000} km` : `${r} m`}
                </button>
              ))}
            </div>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Catégories (facultatif)
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {FLASH_CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => toggleCategory(c.key)}
                  aria-pressed={config.categories.includes(c.key)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    config.categories.includes(c.key)
                      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <Button
              onClick={() => start(config)}
              className="mt-4 h-12 w-full rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow"
            >
              <RadarIcon className="mr-2 h-4 w-4" /> Lancer le scan
            </Button>
          </motion.section>
        )}
      </AnimatePresence>

      {error && (
        <div className="mt-5">
          <ErrorState title="Scan interrompu" description={error} onRetry={() => start(config)} />
        </div>
      )}

      {phase !== "idle" && (
        <>
          <div className="mt-6">
            <Radar active={phase === "scanning"} results={results} progress={progress} />
          </div>
          <p
            aria-live="polite"
            className="mt-4 text-center text-sm font-medium text-muted-foreground"
          >
            {step}
          </p>

          <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {BUCKETS.filter((b) => results.some((r) => r.bucket === b.key)).map((b) => (
              <button
                key={b.key}
                type="button"
                onClick={() => toggleFilter(b.key)}
                aria-pressed={filters.has(b.key)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  filters.has(b.key)
                    ? "bg-gradient-primary text-primary-foreground shadow-glow"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {b.label}
              </button>
            ))}
            {filters.size > 0 && (
              <button
                type="button"
                onClick={() => setFilters(new Set())}
                className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-primary"
              >
                Tout voir
              </button>
            )}
          </div>

          {grouped.map((group) => (
            <div key={group.key}>
              <SectionLabel label={group.label} trailing={`${group.items.length}`} />
              <div className="mt-3 space-y-2.5">
                {group.items.map((r) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Link
                      to={r.href}
                      className={cn(
                        "glass shadow-float flex items-center gap-3 rounded-2xl px-4 py-3 outline-none transition-transform hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-primary",
                        r.bucket === "meilleur" && "ring-1 ring-primary/40",
                        r.bucket === "urgence" && "ring-1 ring-destructive/40",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{r.title}</p>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {r.subtitle}
                          {r.distanceM !== undefined && ` · ${formatDistance(r.distanceM)}`}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}

          {phase === "done" && results.length === 0 && (
            <div className="mt-5">
              <EmptyState
                icon={<RadarIcon className="h-5 w-5" />}
                title="Rien dans ce périmètre"
                description="Élargis le rayon ou change de mode : il se passe forcément quelque chose un peu plus loin."
              />
            </div>
          )}

          {phase === "done" && (
            <Button
              variant="ghost"
              onClick={reset}
              className="mt-5 h-12 w-full rounded-2xl border border-border/60"
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Régler et relancer
            </Button>
          )}
          <div className="pb-4" />
        </>
      )}
    </AppShell>
  );
};

export default ScanPage;
