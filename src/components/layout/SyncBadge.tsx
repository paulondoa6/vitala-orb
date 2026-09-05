import { AlertTriangle, CloudOff, Loader2, RefreshCw } from "lucide-react";
import { useEntitySync } from "@/core/useSync";
import { cn } from "@/lib/utils";

interface Props {
  /** Identifiant local de la carte concernée (flash.id, espace.uuid). */
  refId: string;
  className?: string;
}

/**
 * Badge d'état posé sur une seule carte : rien ne s'affiche si tout est synchronisé.
 * Une carte = un rôle : ici, uniquement l'état d'envoi de cette carte.
 */
export const SyncBadge = ({ refId, className }: Props) => {
  const { status, retry, keepMine, keepServer } = useEntitySync(refId);

  if (status === "synced") return null;

  if (status === "pending" || status === "syncing") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground",
          className,
        )}
      >
        {status === "syncing" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <CloudOff className="h-3 w-3" />
        )}
        {status === "syncing" ? "Envoi en cours" : "En attente d'envoi"}
      </span>
    );
  }

  if (status === "failed") {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void retry();
        }}
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive transition-colors hover:bg-destructive/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        <RefreshCw className="h-3 w-3" /> Non envoyé · Réessayer
      </button>
    );
  }

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1", className)}>
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
        <AlertTriangle className="h-3 w-3" /> Deux versions
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void keepMine();
        }}
        className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Garder la mienne
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void keepServer();
        }}
        className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Garder l'autre
      </button>
    </span>
  );
};
