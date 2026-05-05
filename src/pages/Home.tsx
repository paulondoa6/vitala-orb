import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { FlashCard, FlashItem } from "@/components/flash/FlashCard";
import { FlashCardSkeleton } from "@/components/flash/FlashCardSkeleton";
import { motion } from "framer-motion";

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
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Flash · Around you
        </p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">
          Best for you, now
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ranked by indice vital and live deals.
        </p>
      </motion.div>

      <div className="mt-6 space-y-3">
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
