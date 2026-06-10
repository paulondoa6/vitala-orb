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
      <PageHeader
        eyebrow="Flash · autour de vous"
        title={
          <>
            Le meilleur, <span className="italic font-normal text-primary">maintenant</span>
          </>
        }
        subtitle="Classé selon votre indice vital et les offres en cours."
      />

      <SectionLabel label={loading ? "Recherche…" : `${items.length} adresses`} />

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
