import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Flame, MapPin, Sparkles, Users, Zap } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorState, PageHeader, SectionLabel } from "@/components/layout/PageScaffold";
import { ListSkeleton } from "@/components/layout/Skeletons";
import { activityLabel, type ZonePulse } from "./api";
import { useZonePulses } from "./hooks";

const ZoneRow = ({ pulse, index }: { pulse: ZonePulse; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay: Math.min(index * 0.06, 0.3), ease: "easeOut" }}
  >
    <Link
      to={`/zone/${pulse.zone.id}`}
      className="glass shadow-float block rounded-3xl px-4 py-4 outline-none transition-transform hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MapPin className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold tracking-tight">{pulse.zone.name}</h3>
            <span className="shrink-0 text-[11px] text-muted-foreground">{pulse.zone.city}</span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {pulse.zone.description}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-primary" />
              {pulse.liveFlashes} en direct
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {pulse.members} membre{pulse.members > 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {pulse.opportunities} opportunité{pulse.opportunities > 1 ? "s" : ""}
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pulse.activity}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-primary"
              />
            </div>
            <span className="flex items-center gap-1 text-[10px] font-medium text-primary">
              <Flame className="h-3 w-3" />
              {activityLabel(pulse.activity)}
            </span>
          </div>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
    </Link>
  </motion.div>
);

const ZonePage = () => {
  const { pulses, loading, error, reload } = useZonePulses();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Zone"
        title={
          <>
            Là où <span className="italic font-normal text-primary">ça se passe</span>
          </>
        }
        subtitle="Les quartiers classés par activité réelle : flashs en cours, membres, opportunités."
      />

      {error ? (
        <div className="mt-6">
          <ErrorState title="Zones indisponibles" description={error} onRetry={reload} />
        </div>
      ) : loading ? (
        <div className="mt-6">
          <ListSkeleton count={4} />
        </div>
      ) : (
        <>
          <SectionLabel label={`${pulses.length} zones`} trailing="triées par activité" />
          <div className="mt-3 space-y-3 pb-4">
            {pulses.map((p, i) => (
              <ZoneRow key={p.zone.id} pulse={p} index={i} />
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
};

export default ZonePage;
