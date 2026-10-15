import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Bell, CloudOff, Plus, Radar, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState, ErrorState, LoadingState, SectionLabel } from "@/components/layout/PageScaffold";
import { SyncBadge } from "@/components/layout/SyncBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { FLASH_CATEGORIES } from "@/modules/flash/api";
import { RADAR_RADII, createWatch, deleteWatch, markAlertRead, radiusLabel, toggleWatch } from "./api";
import { useRadarScreen } from "./hooks";

const NewWatchForm = ({ onDone }: { onDone: () => void }) => {
  const [label, setLabel] = useState("");
  const [cats, setCats] = useState<string[]>([]);
  const [radius, setRadius] = useState(1000);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createWatch({ label, categories: cats, radiusM: radius });
      toast.success("Veille créée", { description: "On te prévient dès que ça bouge." });
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Veille non créée");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={submit}
      className="glass shadow-float mt-3 space-y-4 overflow-hidden rounded-3xl p-4"
    >
      <Input
        autoFocus
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        maxLength={60}
        placeholder="Ex. : vélo d'occasion, baby-sitting…"
        aria-label="Ce que tu cherches"
        className="h-11 rounded-xl"
      />
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Quoi</p>
        <div className="flex flex-wrap gap-2">
          {FLASH_CATEGORIES.map((c) => {
            const on = cats.includes(c.key);
            return (
              <button
                type="button"
                key={c.key}
                aria-pressed={on}
                onClick={() => setCats((p) => (on ? p.filter((x) => x !== c.key) : [...p, c.key]))}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  on ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/80",
                )}
              >
                {c.emoji} {c.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Jusqu'où</p>
        <div className="grid grid-cols-4 gap-2">
          {RADAR_RADII.map((r) => (
            <button
              type="button"
              key={r}
              aria-pressed={radius === r}
              onClick={() => setRadius(r)}
              className={cn(
                "h-10 rounded-xl text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                radius === r ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              {r < 1000 ? `${r} m` : `${r / 1000} km`}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" className="flex-1 rounded-xl" onClick={onDone}>
          Annuler
        </Button>
        <Button type="submit" disabled={saving || label.trim().length < 2} className="flex-1 rounded-xl">
          Créer la veille
        </Button>
      </div>
    </motion.form>
  );
};

const RadarPage = () => {
  const navigate = useNavigate();
  const { screen, loading, error, reload } = useRadarScreen();
  const [adding, setAdding] = useState(false);

  return (
    <AppShell>
      <div className="flex items-center gap-2 pt-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Retour"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
          className="h-11 w-11 rounded-2xl"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight">Mon radar</h1>
          <p className="text-xs text-muted-foreground">Ce que tu surveilles autour de toi</p>
        </div>
      </div>

      {screen?.source === "local" && (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <CloudOff className="h-3.5 w-3.5" /> Hors ligne ou non connecté — tes changements partiront plus tard.
        </p>
      )}

      {loading ? (
        <LoadingState className="mt-6" label="On allume le radar…" />
      ) : error ? (
        <ErrorState className="mt-6" description={error} onRetry={reload} />
      ) : (
        <>
          <SectionLabel
            label="Mes veilles"
            trailing={
              !adding && (
                <button
                  onClick={() => setAdding(true)}
                  className="flex items-center gap-1 font-medium text-primary focus-visible:outline-none focus-visible:underline"
                >
                  <Plus className="h-3.5 w-3.5" /> Ajouter
                </button>
              )
            }
          />
          <AnimatePresence>{adding && <NewWatchForm onDone={() => setAdding(false)} />}</AnimatePresence>
          <div className="mt-3 space-y-2.5">
            {screen!.watches.length === 0 && !adding ? (
              <EmptyState
                icon={<Radar className="h-5 w-5" />}
                title="Aucune veille"
                description="Dis-nous ce que tu cherches, on te prévient dès que ça apparaît près de toi."
                action={
                  <Button size="sm" className="rounded-xl" onClick={() => setAdding(true)}>
                    Créer ma première veille
                  </Button>
                }
              />
            ) : (
              screen!.watches.map((w) => (
                <motion.div
                  key={w.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("glass shadow-float rounded-3xl px-4 py-3", !w.active && "opacity-60")}
                >
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{w.label}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {radiusLabel(w.radiusM)}
                        {w.categories.length > 0 &&
                          ` · ${w.categories
                            .map((c) => FLASH_CATEGORIES.find((f) => f.key === c)?.emoji)
                            .join(" ")}`}
                      </p>
                      <SyncBadge refId={w.id} className="mt-1" />
                    </div>
                    <Switch
                      checked={w.active}
                      onCheckedChange={(v) => void toggleWatch(w.id, v)}
                      aria-label={w.active ? `Mettre en pause « ${w.label} »` : `Réactiver « ${w.label} »`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Supprimer « ${w.label} »`}
                      className="h-10 w-10 rounded-xl text-muted-foreground"
                      onClick={() => {
                        void deleteWatch(w.id);
                        toast("Veille supprimée");
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <SectionLabel
            label="Alertes"
            trailing={screen!.unread > 0 ? `${screen!.unread} nouvelle${screen!.unread > 1 ? "s" : ""}` : undefined}
          />
          <div className="mt-3 space-y-2 pb-4">
            {screen!.alerts.length === 0 ? (
              <EmptyState
                icon={<Bell className="h-5 w-5" />}
                title="Rien de nouveau"
                description="Les alertes de tes veilles arriveront ici."
              />
            ) : (
              screen!.alerts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    void markAlertRead(a.id);
                    if (a.href) navigate(a.href);
                  }}
                  className="glass flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    aria-hidden
                    className={cn("h-2 w-2 shrink-0 rounded-full", a.read ? "bg-transparent" : "bg-primary")}
                  />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-sm", !a.read && "font-semibold")}>{a.title}</span>
                    <span className="text-[11px] text-muted-foreground">{a.ageLabel}</span>
                  </span>
                  <span className="sr-only">{a.read ? "lue" : "non lue"}</span>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </AppShell>
  );
};

export default RadarPage;
