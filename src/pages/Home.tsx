import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { FlashCard, FlashItem } from "@/components/flash/FlashCard";
import { FlashCardSkeleton } from "@/components/flash/FlashCardSkeleton";
import { PageHeader, SectionLabel } from "@/components/layout/PageScaffold";

const MOCK: FlashItem[] = [
  {
    id: "1",
    name: "Maison Verte",
    category: "Restaurant · Bio",
    distance: "180 m",
    indiceVital: 94,
    flashEndsAt: Date.now() + 12 * 60 * 1000,
    best: true,
  },
  { id: "2", name: "Bowl & Soul", category: "Healthy bowls", distance: "320 m", indiceVital: 87 },
  { id: "3", name: "Le Pressoir", category: "Juice bar", distance: "450 m", indiceVital: 81, flashEndsAt: Date.now() + 5 * 60 * 1000 },
  { id: "4", name: "Atelier Grain", category: "Bakery", distance: "620 m", indiceVital: 74 },
  { id: "5", name: "Pasta Nova", category: "Italian", distance: "780 m", indiceVital: 62 },
  { id: "6", name: "Burger Lab", category: "Fast food", distance: "1.1 km", indiceVital: 48 },
];

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FlashItem[]>([]);

  useEffect(() => {
    const t = setTimeout(() => {
      setItems(MOCK);
      setLoading(false);
    }, 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <AppShell>
      <motion.section
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="pt-2"
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary/80">
          Flash · autour de vous
        </p>
        <h1 className="mt-2 text-[28px] leading-tight font-semibold tracking-tight text-foreground">
          Le meilleur, <span className="italic font-normal text-primary">maintenant</span>
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-[28ch]">
          Classé selon votre indice vital et les offres en cours.
        </p>
      </motion.section>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mt-7 flex items-center justify-between"
      >
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {loading ? "Recherche…" : `${items.length} adresses`}
        </h2>
        <span className="h-px flex-1 ml-3 bg-gradient-to-r from-border to-transparent" />
      </motion.div>

      <div className="mt-4 space-y-3 pb-4">
        {loading ? (
          <>
            <FlashCardSkeleton large />
            <FlashCardSkeleton />
            <FlashCardSkeleton />
            <FlashCardSkeleton />
          </>
        ) : (
          items.map((item, i) => <FlashCard key={item.id} item={item} index={i} />)
        )}
      </div>
    </AppShell>
  );
};

export default Home;
