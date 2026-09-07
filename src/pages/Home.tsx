import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, MapPin, Radar, LayoutGrid, ArrowRight, History } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, SectionLabel, Skeleton, ErrorState } from "@/components/layout/PageScaffold";
import { useHomeScreen } from "@/modules/home/hooks";
import type { HomeTileDTO } from "@/modules/home/api";

const TILE_COPY: Record<HomeTileDTO["key"], { icon: typeof Zap; title: string; line: string }> = {
  flash: { icon: Zap, title: "Flash", line: "Dis ce dont tu as besoin, maintenant." },
  zone: { icon: MapPin, title: "Zone", line: "Vois ce qui bouge autour de toi." },
  scan: { icon: Radar, title: "Scan", line: "Laisse l'app chercher à ta place." },
  espace: { icon: LayoutGrid, title: "Espace", line: "Crée ton lieu, ton équipe, tes services." },
};

const Home = () => {
  const { data, error, reload, firstName } = useHomeScreen();

  return (
    <AppShell>
      <PageHeader
        eyebrow={firstName ? `Salut ${firstName}` : "Bienvenue"}
        title={
          <>
            Tout se passe <span className="italic font-normal text-primary">ici</span>, autour de toi
          </>
        }
        subtitle="Quatre façons d'avancer : demander, explorer, chercher, créer."
      />

      {data?.resume && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4"
        >
          <Link
            to={data.resume.to}
            className="glass shadow-float flex items-center gap-3 rounded-3xl p-4 outline-none transition-colors hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary/15 ring-1 ring-primary/25">
              <History className="h-4 w-4 text-primary" strokeWidth={2.2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold tracking-tight">{data.resume.title}</span>
              <span className="block truncate text-xs text-muted-foreground">{data.resume.detail}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
          </Link>
        </motion.div>
      )}

      <SectionLabel label="Par où tu commences ?" />

      {error && !data ? (
        <ErrorState description={error} onRetry={reload} className="mt-4" />
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 pb-4">
          {!data
            ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-3xl" />)
            : data.tiles.map((t, i) => {
                const copy = TILE_COPY[t.key];
                return (
                  <motion.div
                    key={t.key}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i, type: "spring", stiffness: 260, damping: 24 }}
                  >
                    <Link
                      to={t.to}
                      className="glass shadow-float group flex h-full flex-col justify-between rounded-3xl p-4 outline-none transition-colors hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary/15 ring-1 ring-primary/25">
                        <copy.icon className="h-5 w-5 text-primary" strokeWidth={2.2} />
                      </span>
                      <div className="mt-4">
                        <h2 className="text-base font-semibold tracking-tight">{copy.title}</h2>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{copy.line}</p>
                      </div>
                      <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                        {t.metric}
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
        </div>
      )}

      <p className="pb-4 text-center text-[11px] text-muted-foreground">
        On te demande ton prénom seulement au moment d'agir. Rien d'autre.
      </p>
    </AppShell>
  );
};

export default Home;
