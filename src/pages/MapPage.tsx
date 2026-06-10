import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Compass, Navigation2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  PageHeader,
  SectionLabel,
  EmptyState,
  ErrorState,
} from "@/components/layout/PageScaffold";
import { MapSkeleton, ListRowSkeleton } from "@/components/layout/Skeletons";
import { Button } from "@/components/ui/button";

const MapPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => load(), [load]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Zone · autour de vous"
        title={
          <>
            La carte, <span className="italic font-normal text-primary">vivante</span>
          </>
        }
        subtitle="Visualisez les adresses Flash et les espaces partenaires à proximité."
      />

      <SectionLabel label={loading ? "Localisation…" : error ? "Erreur" : "Carte"} />

      <div className="mt-4 pb-4 space-y-3">
        {loading ? (
          <>
            <MapSkeleton />
            <ListRowSkeleton />
            <ListRowSkeleton />
          </>
        ) : error ? (
          <ErrorState
            title="Impossible de charger la carte"
            description="Vérifiez votre connexion ou réessayez dans un instant."
            onRetry={load}
          />
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative h-[55vh] overflow-hidden rounded-3xl glass shadow-float"
            >
              <div
                aria-hidden
                className="absolute inset-0 opacity-60"
                style={{
                  background:
                    "radial-gradient(ellipse at 30% 20%, hsl(var(--primary-glow)/0.30), transparent 60%), radial-gradient(ellipse at 80% 70%, hsl(var(--accent)/0.40), transparent 55%)",
                }}
              />
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "linear-gradient(hsl(var(--border)/0.5) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)/0.5) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Vous êtes ici</p>
                  <p className="text-[11px] text-muted-foreground">12 adresses à proximité</p>
                </div>
                <Button
                  size="sm"
                  className="mt-2 rounded-xl bg-gradient-primary text-primary-foreground shadow-glow"
                >
                  <Navigation2 className="mr-1 h-3.5 w-3.5" /> Me localiser
                </Button>
              </div>
            </motion.div>

            <SectionLabel label="Filtres" />
            <EmptyState
              icon={<Compass className="h-5 w-5" />}
              title="Aucun filtre actif"
              description="Choisissez une catégorie pour affiner les lieux affichés sur la carte."
            />
          </>
        )}
      </div>
    </AppShell>
  );
};

export default MapPage;
