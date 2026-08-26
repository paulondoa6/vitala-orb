import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Flame, Sparkles, Users, Zap } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState, ErrorState, LoadingState, SectionLabel } from "@/components/layout/PageScaffold";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ensureIdentity } from "@/core/identity";
import { FlashItemCard } from "@/modules/flash/components/FlashItemCard";
import { activityLabel, joinZone } from "./api";
import { useZoneDetail } from "./hooks";

const ZoneDetail = () => {
  const { zoneId } = useParams();
  const { pulse, flashes, joined, loading, error, reload, setJoined } = useZoneDetail(zoneId);
  const [busy, setBusy] = useState(false);

  const join = async () => {
    if (!pulse || busy) return;
    const me = await ensureIdentity("rejoindre cette zone");
    if (!me?.firstName) return;
    setBusy(true);
    try {
      await joinZone(pulse.zone.id, me.id);
      setJoined(true);
      toast.success(`Bienvenue dans ${pulse.zone.name}`, {
        description: "Tu verras les flashs et les opportunités du quartier en priorité.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <Link
        to="/zone"
        className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Toutes les zones
      </Link>

      {loading ? (
        <div className="mt-6">
          <LoadingState label="On prend le pouls du quartier…" />
        </div>
      ) : error || !pulse ? (
        <div className="mt-6">
          <ErrorState
            title="Zone introuvable"
            description={error ?? "Cette zone n'est plus disponible."}
            onRetry={reload}
          />
        </div>
      ) : (
        <>
          <motion.header
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="glass shadow-float mt-4 rounded-3xl p-5"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary/80">
              {pulse.zone.city}
            </p>
            <h1 className="mt-1.5 text-[26px] font-semibold leading-tight tracking-tight">
              {pulse.zone.name}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {pulse.zone.description}
            </p>

            <div className="mt-4 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pulse.activity}%` }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-primary"
                />
              </div>
              <span className="flex items-center gap-1 text-[11px] font-medium text-primary">
                <Flame className="h-3.5 w-3.5" />
                {activityLabel(pulse.activity)}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                { icon: Zap, value: pulse.liveFlashes, label: "en direct" },
                { icon: Users, value: pulse.members, label: "membres" },
                { icon: Sparkles, value: pulse.opportunities, label: "opportunités" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-secondary/60 py-2.5">
                  <s.icon className="mx-auto h-3.5 w-3.5 text-primary" />
                  <p className="mt-1 text-base font-semibold tabular-nums">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            <Button
              onClick={join}
              disabled={joined || busy}
              className="mt-4 h-12 w-full rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow disabled:opacity-100"
            >
              {joined ? (
                <>
                  <Check className="mr-2 h-4 w-4" /> Tu fais partie de cette zone
                </>
              ) : (
                "Rejoindre cette zone"
              )}
            </Button>
          </motion.header>

          <SectionLabel label="Opportunités" trailing={`${pulse.opportunities}`} />
          <div className="mt-3 space-y-2.5">
            {pulse.zone.opportunities.length === 0 ? (
              <EmptyState
                icon={<Sparkles className="h-5 w-5" />}
                title="Rien à saisir pour l'instant"
                description="Les espaces du quartier n'ont rien publié récemment."
              />
            ) : (
              pulse.zone.opportunities.map((op) => (
                <div key={op.id} className="glass shadow-float rounded-2xl px-4 py-3">
                  <p className="text-sm font-medium">{op.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{op.detail}</p>
                </div>
              ))
            )}
          </div>

          <SectionLabel label="Flashs du quartier" trailing={`${flashes.length}`} />
          <div className="mt-3 space-y-3 pb-4">
            {flashes.length === 0 ? (
              <EmptyState
                icon={<Zap className="h-5 w-5" />}
                title="Aucun flash actif ici"
                description="Publie le tien depuis l'onglet Flash, les membres de la zone le verront."
              />
            ) : (
              flashes.map((f, i) => <FlashItemCard key={f.id} flash={f} index={i} />)
            )}
          </div>
        </>
      )}
    </AppShell>
  );
};

export default ZoneDetail;
