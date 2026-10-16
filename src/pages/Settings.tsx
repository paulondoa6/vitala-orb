import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AppShell } from "@/components/layout/AppShell";
import { Bell, Check, ChevronRight, Download, Globe, Lock, Moon } from "lucide-react";
import { LANGUAGES, setLanguage } from "@/core/i18n";
import { cn } from "@/lib/utils";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const useInstall = () => {
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  const installed =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true);
  useEffect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      setEvt(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", on);
    return () => window.removeEventListener("beforeinstallprompt", on);
  }, []);
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return { evt, installed, ios, clear: () => setEvt(null) };
};

const Settings = () => {
  const { t, i18n } = useTranslation();
  const install = useInstall();
  const [showIos, setShowIos] = useState(false);
  const current = i18n.resolvedLanguage ?? "fr";

  const groups = [
    { icon: Bell, label: t("settings.notifications"), hint: t("settings.notificationsHint") },
    { icon: Moon, label: t("settings.appearance"), hint: t("settings.appearanceHint") },
    { icon: Lock, label: t("settings.privacy"), hint: t("settings.privacyHint") },
  ];

  return (
    <AppShell>
      <div className="pt-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t("settings.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      <section className="glass shadow-float mt-6 rounded-2xl p-4" aria-labelledby="lang-title">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Globe className="h-4.5 w-4.5" />
          </span>
          <span>
            <span id="lang-title" className="block text-sm font-medium">{t("settings.language")}</span>
            <span className="block text-xs text-muted-foreground">{t("settings.languageHint")}</span>
          </span>
        </div>
        <div role="radiogroup" aria-labelledby="lang-title" className="mt-3 grid grid-cols-3 gap-2">
          {LANGUAGES.map((l) => {
            const on = current === l.code;
            return (
              <button
                key={l.code}
                role="radio"
                aria-checked={on}
                onClick={() => void setLanguage(l.code)}
                className={cn(
                  "flex h-11 items-center justify-center gap-1 rounded-xl text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  on ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/80",
                )}
              >
                {on && <Check className="h-3.5 w-3.5" />} {l.label}
              </button>
            );
          })}
        </div>
      </section>

      <button
        disabled={install.installed}
        onClick={async () => {
          if (install.evt) {
            await install.evt.prompt();
            install.clear();
          } else setShowIos(true);
        }}
        className="glass shadow-float mt-2 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-accent/40 disabled:opacity-60"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Download className="h-4.5 w-4.5" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-medium">{t("settings.install")}</span>
          <span className="block text-xs text-muted-foreground">
            {install.installed ? t("settings.installed") : showIos ? t("settings.iosInstall") : t("settings.installHint")}
          </span>
        </span>
      </button>

      <div className="mt-2 space-y-2">
        {groups.map(({ icon: Icon, label, hint }) => (
          <button
            key={label}
            className="glass shadow-float flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-accent/40"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
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
};

export default Settings;
