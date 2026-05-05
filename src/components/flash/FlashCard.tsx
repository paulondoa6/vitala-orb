import { motion } from "framer-motion";
import { MapPin, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { VitalScore } from "./VitalScore";
import { FlashLiveBadge } from "./FlashLiveBadge";
import { cn } from "@/lib/utils";

export interface FlashItem {
  id: string;
  name: string;
  category: string;
  distance: string;
  indiceVital: number;
  flashEndsAt?: number;
  best?: boolean;
}

interface FlashCardProps {
  item: FlashItem;
  index: number;
}

export const FlashCard = ({ item, index }: FlashCardProps) => {
  const navigate = useNavigate();
  const isBest = item.best;

  return (
    <motion.button
      type="button"
      onClick={() => navigate(`/flash/${item.id}`)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.4, 0, 0.2, 1] }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group relative w-full overflow-hidden rounded-3xl text-left transition-shadow",
        "glass shadow-float",
        isBest && "shadow-glow ring-1 ring-primary/40"
      )}
    >
      {isBest && (
        <>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -inset-px rounded-3xl opacity-60"
            style={{
              background:
                "conic-gradient(from 180deg at 50% 50%, hsl(var(--primary)/0.0), hsl(var(--primary)/0.5), hsl(var(--primary-glow)/0.5), hsl(var(--primary)/0.0))",
              filter: "blur(20px)",
            }}
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-background">
            <Sparkles className="h-3 w-3" />
            Best Choice
          </div>
        </>
      )}

      <div className={cn("relative z-10 p-5", isBest && "pt-12")}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              {item.category}
            </p>
            <h3
              className={cn(
                "mt-1 truncate font-semibold tracking-tight",
                isBest ? "text-2xl" : "text-lg"
              )}
            >
              {item.name}
            </h3>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{item.distance}</span>
            </div>

            {item.flashEndsAt && (
              <div className="mt-3">
                <FlashLiveBadge endsAt={item.flashEndsAt} />
              </div>
            )}
          </div>

          <VitalScore score={item.indiceVital} size={isBest ? "lg" : "sm"} />
        </div>
      </div>
    </motion.button>
  );
};
