import { AppShell } from "@/components/layout/AppShell";
import { Bell, Globe, Lock, Moon, ChevronRight } from "lucide-react";

const groups = [
  { icon: Bell, label: "Notifications", hint: "Alertes Flash & rappels" },
  { icon: Moon, label: "Apparence", hint: "Thème sombre, contraste" },
  { icon: Globe, label: "Langue & région", hint: "Français · France" },
  { icon: Lock, label: "Confidentialité", hint: "Données & permissions" },
];

const Settings = () => (
  <AppShell>
    <div className="pt-2">
      <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
      <p className="mt-1 text-sm text-muted-foreground">Personnalise ton expérience vitalio.</p>
    </div>
    <div className="mt-6 space-y-2">
      {groups.map(({ icon: Icon, label, hint }) => (
        <button
          key={label}
          className="glass shadow-float flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-accent/40"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary/15 text-primary">
            <Icon className="h-4.5 w-4.5" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-medium text-foreground">{label}</span>
            <span className="block text-xs text-muted-foreground">{hint}</span>
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      ))}
    </div>
    <p className="mt-8 text-center text-[11px] text-muted-foreground">vitalio · v1.0.0</p>
  </AppShell>
);

export default Settings;
