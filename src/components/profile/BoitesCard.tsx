import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid, ChevronRight, Plus, Sparkles } from "lucide-react";
import { listBoitesByOwner, getCurrentOwnerId, type Boite } from "@/modules/espace/api";

export const BoitesCard = () => {
  const [boites, setBoites] = useState<Boite[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const owned = await listBoitesByOwner(getCurrentOwnerId());
        if (!cancelled) setBoites(owned);
      } catch {
        if (!cancelled) setBoites([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!boites) return null;

  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight">Mes Espaces</h3>
        <Link to="/create" className="text-[11px] font-medium text-primary inline-flex items-center gap-0.5">
          Voir tout <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {boites.length === 0 ? (
        <Link
          to="/create"
          className="glass shadow-float flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border/60 py-5 text-sm font-medium text-muted-foreground hover:bg-accent/10 transition-colors"
        >
          <Plus className="h-4 w-4" /> Créer un Espace
        </Link>
      ) : (
        <div className="space-y-2">
          {boites.slice(0, 3).map((b) => (
            <Link
              key={b.uuid}
              to={`/boite/${b.uuid}`}
              className="glass shadow-float flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-accent/10"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-primary text-primary-foreground">
                {b.logo ? (
                  <img src={b.logo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{b.name ?? "Espace sans nom"}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="font-mono text-[10px] tracking-widest text-muted-foreground">{b.uuid}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    {b.types[0]}
                    {b.types.length > 1 ? ` +${b.types.length - 1}` : ""}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
          <Link
            to="/create"
            className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border/60 py-2.5 text-xs font-medium text-muted-foreground hover:bg-accent/10 transition-colors"
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Nouvel Espace
          </Link>
        </div>
      )}
    </section>
  );
};
