import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, MapPin, Send, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ensureIdentity, useIdentity } from "@/core/identity";
import { getPosition } from "@/core/permissions";
import { FLASH_CATEGORIES, FLASH_DURATIONS, publishFlash } from "../api";
import type { FlashCategory } from "@/core/db";

export const FlashComposer = ({ onPublished }: { onPublished?: () => void }) => {
  const { identity } = useIdentity();
  const [text, setText] = useState("");
  const [category, setCategory] = useState<FlashCategory>("service");
  const [duration, setDuration] = useState(60);
  const [urgent, setUrgent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    const me = await ensureIdentity("publier ton flash");
    if (!me?.firstName) return;
    setBusy(true);
    try {
      const position = await getPosition();
      await publishFlash({
        text,
        category,
        durationMinutes: duration,
        urgency: urgent ? "urgent" : "normal",
        authorId: me.id,
        authorName: me.firstName,
        position,
      });
      setText("");
      setUrgent(false);
      toast.success("Ton flash est en ligne", {
        description: "On prévient les personnes autour de toi.",
      });
      onPublished?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Publication impossible");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="glass shadow-float rounded-3xl p-4"
      aria-label="Publier un flash"
    >
      <label htmlFor="flash-text" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        De quoi as-tu besoin ?
      </label>
      <textarea
        id="flash-text"
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 180))}
        rows={2}
        placeholder="Ex : je cherche une perceuse pour ce soir…"
        className="mt-2 w-full resize-none rounded-2xl border border-border/60 bg-background/60 px-3.5 py-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-primary"
      />

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FLASH_CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setCategory(c.key)}
            aria-pressed={category === c.key}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary",
              category === c.key
                ? "bg-gradient-primary text-primary-foreground shadow-glow"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            <span aria-hidden className="mr-1">{c.emoji}</span>
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex gap-1.5" role="group" aria-label="Durée du flash">
          {FLASH_DURATIONS.map((d) => (
            <button
              key={d.minutes}
              type="button"
              onClick={() => setDuration(d.minutes)}
              aria-pressed={duration === d.minutes}
              className={cn(
                "rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary",
                duration === d.minutes
                  ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setUrgent((u) => !u)}
          aria-pressed={urgent}
          className={cn(
            "flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary",
            urgent
              ? "bg-destructive/10 text-destructive ring-1 ring-destructive/30"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Siren className="h-3.5 w-3.5" /> Urgent
        </button>
      </div>

      <Button
        onClick={submit}
        disabled={busy || text.trim().length < 3}
        className="mt-3 h-12 w-full rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow"
      >
        {busy ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> On diffuse…
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" /> Publier maintenant
          </>
        )}
      </Button>
      <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
        <MapPin className="h-3 w-3" />
        {identity?.firstName
          ? `${identity.firstName}, ton flash part vers les personnes les plus proches.`
          : "On te demandera juste ton prénom avant de publier."}
      </p>
    </motion.section>
  );
};
