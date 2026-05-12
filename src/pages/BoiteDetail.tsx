import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Copy,
  Share2,
  MessageCircle,
  Facebook,
  Sparkles,
  Wrench,
  Users,
  ShieldCheck,
  UserPlus,
  MapPin,
  Check,
  Loader2,
  ScanLine,
  ShieldAlert,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import {
  getBoite,
  generateShareLink,
  isValidBoiteUuid,
  type Boite,
} from "@/lib/boiteStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type VerifyStep = "format" | "lookup" | "ready";
type VerifyState =
  | { phase: "verifying"; step: VerifyStep; progress: number; label: string }
  | { phase: "invalid"; reason: "format" | "notfound"; message: string }
  | { phase: "ready" };

const BoiteDetail = () => {
  const { uuid = "" } = useParams();
  const navigate = useNavigate();
  const [boite, setBoite] = useState<Boite | null>(null);
  const [copied, setCopied] = useState(false);
  const [verify, setVerify] = useState<VerifyState>({
    phase: "verifying",
    step: "format",
    progress: 10,
    label: "Vérification du numéro unique…",
  });

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setVerify({ phase: "verifying", step: "format", progress: 15, label: "Vérification du numéro unique…" });
      await new Promise((r) => setTimeout(r, 200));
      if (cancelled) return;
      if (!isValidBoiteUuid(uuid)) {
        setVerify({
          phase: "invalid",
          reason: "format",
          message: `Le code « ${uuid} » n'est pas un numéro unique valide (6 caractères).`,
        });
        return;
      }
      setVerify({ phase: "verifying", step: "lookup", progress: 55, label: "Chargement de la salle correspondante…" });
      const found = await getBoite(uuid);
      if (cancelled) return;
      if (!found) {
        setVerify({
          phase: "invalid",
          reason: "notfound",
          message: `Aucune Espace n'est associée au code ${uuid}.`,
        });
        return;
      }
      setBoite(found);
      setVerify({ phase: "verifying", step: "ready", progress: 100, label: "Espace validée !" });
      await new Promise((r) => setTimeout(r, 350));
      if (cancelled) return;
      setVerify({ phase: "ready" });
      toast.success("Salle chargée", { description: `Numéro ${found.uuid}` });
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [uuid]);

  // Verification screen (loading + scan CTA)
  if (verify.phase === "verifying") {
    return (
      <AppShell>
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-4 text-center">
          <div className="rounded-3xl border border-border/60 bg-white p-4 shadow-float">
            <QRCodeCanvas value={generateShareLink(uuid || "------")} size={168} level="M" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Numéro à vérifier</p>
            <p className="font-mono text-2xl font-bold tracking-[0.3em]">{uuid || "------"}</p>
          </div>
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 rounded-full glass shadow-float px-4 py-2 text-xs font-medium"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            {verify.label}
          </div>
          <div
            className="h-1.5 w-56 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={verify.progress}
          >
            <motion.div
              className="h-full rounded-full bg-gradient-primary"
              initial={{ width: 0 }}
              animate={{ width: `${verify.progress}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/scan")}
            className="rounded-xl text-xs text-muted-foreground"
          >
            <ScanLine className="mr-1 h-3.5 w-3.5" /> Scanner un autre QR
          </Button>
        </div>
      </AppShell>
    );
  }

  if (verify.phase === "invalid") {
    return (
      <AppShell>
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold">
              {verify.reason === "format" ? "Numéro invalide" : "Espace introuvable"}
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">{verify.message}</p>
          </div>
          <div className="flex w-full max-w-xs flex-col gap-2">
            <Button
              onClick={() => navigate("/scan")}
              className="h-11 w-full rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow"
            >
              <ScanLine className="mr-1 h-4 w-4" /> Scanner un QR code
            </Button>
            <Link
              to="/create"
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              ou créer un nouvel Espace
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!boite) return null;

  const link = generateShareLink(boite.uuid);
  const shareText = `Découvre mon Espace ${boite.name ?? ""} sur Vitalio`;

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Lien copié");
    setTimeout(() => setCopied(false), 1800);
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: boite.name ?? "Espace", text: shareText, url: link });
      } catch {
        /* cancelled */
      }
    } else {
      copy();
    }
  };

  const waUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} — ${link}`)}`;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;

  return (
    <AppShell>
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={() => navigate("/")}
          className="flex h-9 w-9 items-center justify-center rounded-xl glass shadow-float"
          aria-label="Retour"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight">{boite.name ?? "Espace"}</h1>
          <p className="text-[11px] text-muted-foreground">Numéro unique · {boite.uuid}</p>
        </div>
      </div>

      {/* Hero card */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-5 overflow-hidden rounded-3xl glass shadow-float"
      >
        <div className="bg-gradient-primary px-5 pb-5 pt-6 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/20 backdrop-blur">
              {boite.logo ? (
                <img src={boite.logo} alt="" className="h-full w-full object-cover" />
              ) : (
                <Sparkles className="h-6 w-6" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{boite.name ?? "Espace sans nom"}</p>
              <p className="text-xs opacity-80">
                {boite.types.length} type{boite.types.length > 1 ? "s" : ""} · créée{" "}
                {new Date(boite.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* QR */}
        <div className="flex flex-col items-center gap-3 px-5 py-6">
          <div className="rounded-2xl border border-border/60 bg-white p-3 shadow-float">
            <QRCodeCanvas value={link} size={168} level="M" includeMargin={false} />
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Numéro public</p>
            <p className="font-mono text-2xl font-bold tracking-[0.3em]">{boite.uuid}</p>
          </div>
        </div>

        {/* Link + actions */}
        <div className="space-y-2 border-t border-border/60 bg-background/40 p-4">
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-2">
            <span className="truncate text-xs text-muted-foreground">{link}</span>
            <button
              onClick={copy}
              className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground transition-colors hover:bg-primary/10"
              aria-label="Copier le lien"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <Button onClick={copy} variant="outline" className="h-11 rounded-xl">
              <Copy className="mr-1 h-4 w-4" />
              Copier
            </Button>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex h-11 items-center justify-center gap-1 rounded-xl text-sm font-medium",
                "bg-[#25D366] text-white hover:opacity-90",
              )}
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
            <a
              href={fbUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex h-11 items-center justify-center gap-1 rounded-xl text-sm font-medium",
                "bg-[#1877F2] text-white hover:opacity-90",
              )}
            >
              <Facebook className="h-4 w-4" />
              Facebook
            </a>
          </div>

          {typeof navigator !== "undefined" && "share" in navigator && (
            <Button onClick={shareNative} variant="ghost" className="h-9 w-full rounded-xl text-xs">
              <Share2 className="mr-1 h-3.5 w-3.5" /> Partager via…
            </Button>
          )}
        </div>
      </motion.section>

      {/* Location */}
      {boite.location?.label && (
        <section className="mt-4 flex items-center gap-2 rounded-2xl glass shadow-float p-3 text-sm">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="truncate">{boite.location.label}</span>
        </section>
      )}

      {/* Services */}
      <section className="mt-4 rounded-2xl glass shadow-float p-4">
        <div className="mb-3 flex items-center gap-2">
          <Wrench className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Services</p>
          <span className="ml-auto text-[11px] text-muted-foreground">{boite.services.length}</span>
        </div>
        {boite.services.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 p-3 text-center text-xs text-muted-foreground">
            Aucun service
          </p>
        ) : (
          <ul className="space-y-2">
            {boite.services.map((s) => (
              <li key={s.id} className="rounded-xl border border-border/60 bg-background/40 p-3">
                <p className="text-sm font-medium">{s.name}</p>
                {s.description && <p className="mt-0.5 text-xs text-muted-foreground">{s.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Members */}
      <section className="mt-4 rounded-2xl glass shadow-float p-4">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Personnel</p>
          <span className="ml-auto text-[11px] text-muted-foreground">{boite.members.length}</span>
        </div>
        {boite.members.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 p-3 text-center text-xs text-muted-foreground">
            Personne invité
          </p>
        ) : (
          <ul className="space-y-2">
            {boite.members.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-3 py-2"
              >
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg",
                    m.role === "admin" ? "bg-gradient-primary text-primary-foreground" : "bg-muted text-foreground/70",
                  )}
                >
                  {m.role === "admin" ? <ShieldCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm">{m.email}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {m.role === "admin" ? "Admin" : "Modérateur"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
};

export default BoiteDetail;
