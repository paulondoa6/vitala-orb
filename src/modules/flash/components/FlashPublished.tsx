import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCountdown } from "@/core/geo";
import type { Flash } from "@/core/db";

interface Props {
  flash: Flash;
  onNew: () => void;
  onSeeFeed: () => void;
}

/** Écran de confirmation — contrat `flash` : « ton flash est en ligne ». */
export const FlashPublished = ({ flash, onNew, onSeeFeed }: Props) => {
  const [left, setLeft] = useState(flash.expiresAt - Date.now());

  useEffect(() => {
    const t = setInterval(() => setLeft(flash.expiresAt - Date.now()), 1000);
    return () => clearInterval(t);
  }, [flash.expiresAt]);

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 240, damping: 24 }}
      className="glass shadow-float rounded-3xl p-5 text-center"
      aria-live="polite"
    >
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/25">
        <CheckCircle2 className="h-6 w-6 text-primary" strokeWidth={2.2} />
      </span>
      <h2 className="mt-3 text-base font-semibold tracking-tight">Ton flash est en ligne</h2>
      <p className="mt-1 text-sm text-muted-foreground">« {flash.text} »</p>
      <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-primary">
        <Clock className="h-3 w-3" />
        visible encore {formatCountdown(Math.max(0, left))}
      </span>
      <div className="mt-4 flex gap-2">
        <Button variant="secondary" onClick={onSeeFeed} className="h-11 flex-1 rounded-2xl text-sm">
          Voir autour de moi
        </Button>
        <Button onClick={onNew} className="h-11 flex-1 rounded-2xl bg-gradient-primary text-primary-foreground text-sm shadow-glow">
          <Plus className="mr-1 h-4 w-4" /> Autre demande
        </Button>
      </div>
    </motion.section>
  );
};
