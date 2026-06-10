import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Sparkles, MapPin, QrCode } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  PageHeader,
  SectionLabel,
  EmptyState,
  ErrorState,
} from "@/components/layout/PageScaffold";
import { ListRowSkeleton } from "@/components/layout/Skeletons";

type Item = {
  id: number;
  icon: typeof Activity;
  title: string;
  hint: string;
  time: string;
};

const MOCK: Item[] = [
  { id: 1, icon: Sparkles, title: "Flash trouvé · Maison Verte", hint: "Indice vital 94", time: "Il y a 2 min" },
  { id: 2, icon: QrCode, title: "QR scanné · Atelier Grain", hint: "Espace ajouté", time: "Il y a 1 h" },
  { id: 3, icon: MapPin, title: "Nouvelle zone explorée", hint: "Quartier latin", time: "Hier" },
  { id: 4, icon: Activity, title: "Streak +1", hint: "12 jours d'affilée", time: "Hier" },
];

const ActivityPage = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const t = setTimeout(() => {
      setItems(MOCK);
      setLoading(false);
    }, 700);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => load(), [load]);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Activité · journal"
        title={
          <>
            Vos derniers <span className="italic font-normal text-primary">mouvements</span>
          </>
        }
        subtitle="Tout ce que vous avez exploré, scanné ou enregistré récemment."
      />

      <SectionLabel
        label={loading ? "Recherche…" : error ? "Erreur" : `${items.length} événements`}
      />

      <div className="mt-4 space-y-3 pb-4">
        {loading ? (
          <>
            <ListRowSkeleton />
            <ListRowSkeleton />
            <ListRowSkeleton />
            <ListRowSkeleton />
          </>
        ) : error ? (
          <ErrorState
            title="Activité indisponible"
            description="Nous n'avons pas pu récupérer votre journal. Réessayez."
            onRetry={load}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Activity className="h-5 w-5" />}
            title="Aucune activité"
            description="Vos scans, découvertes et flashs apparaîtront ici."
          />
        ) : (
          items.map((it, i) => {
            const Icon = it.icon;
            return (
              <motion.article
                key={it.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.06, ease: [0.4, 0, 0.2, 1] }}
                className="flex items-center gap-3 rounded-2xl glass shadow-float p-4"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{it.title}</p>
                  <p className="text-[11px] text-muted-foreground">{it.hint}</p>
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground">{it.time}</span>
              </motion.article>
            );
          })
        )}
      </div>
    </AppShell>
  );
};

export default ActivityPage;
