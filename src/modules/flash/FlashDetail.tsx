import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, MessageCircle, Send, Siren } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState, ErrorState, LoadingState, SectionLabel } from "@/components/layout/PageScaffold";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Flash, FlashReply } from "@/core/db";
import { ensureIdentity, useIdentity } from "@/core/identity";
import { formatCountdown, timeAgo } from "@/core/geo";
import { cn } from "@/lib/utils";
import { FLASH_CATEGORIES, closeFlash, isLive } from "./api";
import { getFlash, listReplies, postReply } from "./replies";

const FlashDetail = () => {
  const { flashId = "" } = useParams();
  const navigate = useNavigate();
  const { identity } = useIdentity();
  const [flash, setFlash] = useState<Flash | null>(null);
  const [replies, setReplies] = useState<FlashReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [, tick] = useState(0);

  const load = useCallback(async () => {
    try {
      setError(null);
      const f = await getFlash(flashId);
      setFlash(f ?? null);
      if (f) setReplies(await listReplies(flashId));
    } catch {
      setError("Impossible d'ouvrir ce flash pour le moment.");
    } finally {
      setLoading(false);
    }
  }, [flashId]);

  useEffect(() => {
    void load();
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [load]);

  const back = () => (window.history.length > 1 ? navigate(-1) : navigate("/flash"));

  const send = async () => {
    if (!flash || sending) return;
    const me = await ensureIdentity("répondre à ce flash");
    if (!me?.firstName) return;
    setSending(true);
    try {
      const r = await postReply({ flashId: flash.id, authorId: me.id, authorName: me.firstName, text: draft });
      setReplies((prev) => [...prev, r]);
      setDraft("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Réponse non envoyée");
    } finally {
      setSending(false);
    }
  };

  const header = (
    <div className="flex items-center gap-2 pt-1">
      <Button variant="ghost" size="icon" onClick={back} aria-label="Retour" className="h-11 w-11 rounded-2xl">
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <p className="text-sm font-semibold">Flash</p>
    </div>
  );

  if (loading) return <AppShell>{header}<LoadingState className="mt-6" /></AppShell>;
  if (error) return <AppShell>{header}<ErrorState className="mt-6" description={error} onRetry={load} /></AppShell>;
  if (!flash)
    return (
      <AppShell>
        {header}
        <EmptyState className="mt-6" title="Ce flash n'existe plus" description="Il a peut-être été clôturé ou a expiré."
          action={<Button onClick={() => navigate("/flash")} className="rounded-xl">Voir les flashs</Button>} />
      </AppShell>
    );

  const category = FLASH_CATEGORIES.find((c) => c.key === flash.category);
  const live = isLive(flash);
  const owned = flash.authorId === identity?.id;
  const urgent = flash.urgency === "urgent";

  return (
    <AppShell>
      {header}
      <motion.article
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("glass shadow-float mt-3 rounded-3xl p-5", urgent && "ring-1 ring-destructive/40")}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-base" aria-hidden>
              {urgent ? <Siren className="h-4 w-4 text-destructive" /> : category?.emoji}
            </span>
            {category?.label}
          </span>
          <span className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums",
            live ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
            <Clock className="h-3 w-3" />
            {live ? formatCountdown(flash.expiresAt - Date.now()) : "Terminé"}
          </span>
        </div>
        <p className="mt-4 text-lg font-medium leading-snug">{flash.text}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">{flash.authorName}</span> · {timeAgo(flash.createdAt)}
        </p>
        {owned && live && (
          <Button variant="outline" size="sm" className="mt-4 w-full rounded-xl"
            onClick={async () => { await closeFlash(flash.id); toast.success("Flash clôturé"); void load(); }}>
            J'ai trouvé, clôturer
          </Button>
        )}
      </motion.article>

      <SectionLabel label="Réponses" trailing={replies.length > 0 ? String(replies.length) : undefined} />
      <div className="mt-3 space-y-2.5" aria-live="polite">
        {replies.length === 0 ? (
          <EmptyState icon={<MessageCircle className="h-5 w-5" />} title="Pas encore de réponse"
            description={owned ? "Les voisins te répondront ici." : "Sois le premier à proposer ton aide."} />
        ) : (
          replies.map((r, i) => {
            const mine = r.authorId === identity?.id;
            return (
              <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.2) }}
                className={cn("max-w-[85%] rounded-2xl px-4 py-2.5", mine ? "ml-auto bg-primary text-primary-foreground" : "glass")}>
                <p className="text-sm leading-snug">{r.text}</p>
                <p className={cn("mt-1 text-[10px]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                  {mine ? "Toi" : r.authorName} · {timeAgo(r.createdAt)}
                </p>
              </motion.div>
            );
          })
        )}
      </div>

      {live && (
        <form className="glass shadow-float sticky bottom-28 mt-5 flex items-end gap-2 rounded-3xl p-2"
          onSubmit={(e) => { e.preventDefault(); void send(); }}>
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={280} rows={1}
            placeholder={owned ? "Ajouter une précision…" : "Proposer ton aide…"} aria-label="Ta réponse"
            className="min-h-[44px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }} />
          <Button type="submit" size="icon" disabled={sending || draft.trim().length < 2}
            aria-label="Envoyer" className="h-11 w-11 shrink-0 rounded-2xl">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}
    </AppShell>
  );
};

export default FlashDetail;
