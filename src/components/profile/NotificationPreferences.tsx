import { Switch } from "@/components/ui/switch";
import { Zap, AlertTriangle, Sparkles, BellRing, Check, Loader2, CloudOff } from "lucide-react";
import { useNotifPrefs, type NotifKey } from "@/lib/profileStore";

const ITEMS: { key: NotifKey; icon: typeof Zap; label: string; hint: string; tone: string }[] = [
  { key: "flash", icon: Zap, label: "Flash", hint: "Alertes en temps réel près de toi", tone: "primary" },
  { key: "urgences", icon: AlertTriangle, label: "Urgences", hint: "Notifications critiques prioritaires", tone: "destructive" },
  { key: "reco", icon: Sparkles, label: "Recommandations", hint: "Suggestions personnalisées Vitalio", tone: "accent" },
  { key: "rappels", icon: BellRing, label: "Rappels", hint: "Routines, scans et objectifs quotidiens", tone: "muted" },
];

const SyncBadge = ({ status }: { status: "idle" | "saving" | "saved" | "error" }) => {
  if (status === "idle") return null;
  const map = {
    saving: { icon: Loader2, text: "Sync…", cls: "text-muted-foreground", spin: true },
    saved: { icon: Check, text: "Sauvegardé", cls: "text-primary", spin: false },
    error: { icon: CloudOff, text: "Hors ligne", cls: "text-destructive", spin: false },
  } as const;
  const { icon: Icon, text, cls, spin } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${cls}`}>
      <Icon className={`h-3 w-3 ${spin ? "animate-spin" : ""}`} />
      {text}
    </span>
  );
};

export const NotificationPreferences = () => {
  const { prefs, status, toggle } = useNotifPrefs();
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-end justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">Préférences de notifications</h3>
          <p className="text-[11px] text-muted-foreground">Sauvegarde instantanée · synchronisé sur tes appareils</p>
        </div>
        <SyncBadge status={status} />
      </div>
      <div className="rounded-2xl glass shadow-float divide-y divide-border/60 overflow-hidden">
        {ITEMS.map(({ key, icon: Icon, label, hint, tone }) => (
          <label
            key={key}
            htmlFor={`notif-${key}`}
            className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/5"
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                tone === "primary"
                  ? "bg-primary/15 text-primary"
                  : tone === "destructive"
                    ? "bg-destructive/15 text-destructive"
                    : tone === "accent"
                      ? "bg-accent/15 text-accent"
                      : "bg-muted text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-medium">{label}</span>
              <span className="block text-[11px] text-muted-foreground">{hint}</span>
            </span>
            <Switch
              id={`notif-${key}`}
              checked={prefs[key]}
              onCheckedChange={(v) => toggle(key, v)}
              aria-label={label}
            />
          </label>
        ))}
      </div>
    </section>
  );
};
