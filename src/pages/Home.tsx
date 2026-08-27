import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, MapPin, Radar, LayoutGrid, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, SectionLabel } from "@/components/layout/PageScaffold";
import { countLiveFlashes } from "@/modules/flash/api";
import { listZonePulses } from "@/modules/zone/api";
import { countBoites } from "@/modules/espace/api";
import { useIdentity } from "@/core/identity";

interface Tile {
  to: string;
  icon: typeof Zap;
  title: string;
  line: string;
  metric: string;
}

const Home = () => {
  const { identity } = useIdentity();
  const [live, setLive] = useState<number | null>(null);
  const [zones, setZones] = useState<number | null>(null);
  const [espaces, setEspaces] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [l, z, e] = await Promise.all([
          countLiveFlashes(),
          listZonePulses(),
          countBoites(),
        ]);
        if (cancelled) return;
        setLive(l);
        setZones(z.length);
        setEspaces(e);
      } catch {
        if (!cancelled) {
          setLive(0);
          setZones(0);
          setEspaces(0);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const n = (v: number | null) => (v === null ? "…" : String(v));

  const tiles: Tile[] = [
    {
      to: "/flash",
      icon: Zap,
      title: "Flash",
      line: "Dis ce dont tu as besoin, maintenant.",
      metric: `${n(live)} en direct`,
    },
    {
      to: "/zone",
      icon: MapPin,
      title: "Zone",
      line: "Vois ce qui bouge autour de toi.",
      metric: `${n(zones)} quartiers`,
    },
    {
      to: "/scan",
      icon: Radar,
      title: "Scan",
      line: "Laisse l'app chercher à ta place.",
      metric: "en 10 s",
    },
    {
      to: "/espace",
      icon: LayoutGrid,
      title: "Espace",
      line: "Crée ton lieu, ton équipe, tes services.",
      metric: `${n(espaces)} créés`,
    },
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow={identity?.firstName ? `Salut ${identity.firstName}` : "Bienvenue"}
        title={
          <>
            Tout se passe <span className="italic font-normal text-primary">ici</span>, autour de toi
          </>
        }
        subtitle="Quatre façons d'avancer : demander, explorer, chercher, créer. Pas de compte, tu commences tout de suite."
      />

      <SectionLabel label="Par où tu commences ?" />

      <div className="mt-4 grid grid-cols-2 gap-3 pb-4">
        {tiles.map((t, i) => (
          <motion.div
            key={t.to}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, type: "spring", stiffness: 260, damping: 24 }}
          >
            <Link
              to={t.to}
              className="glass shadow-float group flex h-full flex-col justify-between rounded-3xl p-4 outline-none transition-colors hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary/15 ring-1 ring-primary/25">
                <t.icon className="h-5 w-5 text-primary" strokeWidth={2.2} />
              </span>
              <div className="mt-4">
                <h2 className="text-base font-semibold tracking-tight">{t.title}</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.line}</p>
              </div>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                {t.metric}
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </motion.div>
        ))}
      </div>

      <p className="pb-4 text-center text-[11px] text-muted-foreground">
        On te demande ton prénom seulement au moment d'agir. Rien d'autre.
      </p>
    </AppShell>
  );
};

export default Home;
