import { motion } from "framer-motion";
import { Clock, MessageCircle, Siren, X } from "lucide-react";
import type { Flash } from "@/core/db";
import { formatCountdown, timeAgo } from "@/core/geo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FLASH_CATEGORIES } from "../api";

interface Props {
  flash: Flash;
  index?: number;
  owned?: boolean;
  onClose?: (id: string) => void;
}

export const FlashItemCard = ({ flash, index = 0, owned, onClose }: Props) => {
  const category = FLASH_CATEGORIES.find((c) => c.key === flash.category);
  const left = flash.expiresAt - Date.now();
  const urgent = flash.urgency === "urgent";

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3), ease: "easeOut" }}
      className={cn(
        "glass shadow-float relative overflow-hidden rounded-3xl px-4 py-3.5",
        urgent && "ring-1 ring-destructive/40",
        owned && "ring-1 ring-primary/40",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg",
            urgent ? "bg-destructive/10" : "bg-primary/10",
          )}
          aria-hidden
        >
          {urgent ? <Siren className="h-4.5 w-4.5 text-destructive" /> : category?.emoji}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug text-foreground">{flash.text}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground/80">{flash.authorName}</span>
            <span aria-hidden>·</span>
            <span>{category?.label}</span>
            <span aria-hidden>·</span>
            <span>{timeAgo(flash.createdAt)}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums",
              left < 5 * 60_000
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary",
            )}
          >
            <Clock className="h-3 w-3" />
            {formatCountdown(left)}
          </span>
          {flash.replies > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <MessageCircle className="h-3 w-3" />
              {flash.replies}
            </span>
          )}
        </div>
      </div>

      {owned && onClose && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onClose(flash.id)}
          className="mt-2 h-8 w-full rounded-xl text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="mr-1 h-3.5 w-3.5" /> J'ai trouvé, clôturer
        </Button>
      )}
    </motion.article>
  );
};
