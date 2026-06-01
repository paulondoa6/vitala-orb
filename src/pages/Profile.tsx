import { AppShell } from "@/components/layout/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BadgeCheck,
  Shield,
  Star,
  Gift,
  Copy,
  Share2,
  MessageSquareQuote,
  ThumbsUp,
  TrendingUp,
  Award,
  Sparkles,
  ChevronRight,
  Crown,
  Users,
  Wallet,
  Lock,
  Bell,
  HelpCircle,
  LogOut,
  ShieldCheck,
  Quote,
  Pencil,
} from "lucide-react";
import { useProfile } from "@/lib/profileStore";
import { NotificationPreferences } from "@/components/profile/NotificationPreferences";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { BoitesCard } from "@/components/profile/BoitesCard";
import { Link } from "react-router-dom";

const stats = [
  { label: "Streak", value: "12j", icon: TrendingUp },
  { label: "Scans", value: "248", icon: Sparkles },
  { label: "Score", value: "92", icon: Star },
];

const trustItems = [
  { icon: BadgeCheck, label: "Identité vérifiée", tone: "primary" },
  { icon: ShieldCheck, label: "Paiement sécurisé", tone: "primary" },
  { icon: Award, label: "Top 5% utilisateurs", tone: "accent" },
  { icon: Lock, label: "Données chiffrées", tone: "muted" },
];

const reviews = [
  {
    name: "Amina K.",
    role: "Service · Coaching nutrition",
    rating: 5,
    text: "Réactif et fiable. Les recommandations Flash m'ont vraiment aidée.",
    date: "il y a 2j",
  },
  {
    name: "Yannick P.",
    role: "Produit · Pack Vitalio Pro",
    rating: 5,
    text: "Qualité au rendez-vous, livraison rapide. Je recommande à 100%.",
    date: "il y a 1 sem.",
  },
  {
    name: "Léa M.",
    role: "Demande · Suivi personnalisé",
    rating: 4,
    text: "Très bonne expérience, l'équipe est à l'écoute.",
    date: "il y a 3 sem.",
  },
];

const settings = [
  { icon: Bell, label: "Notifications", hint: "Alertes Flash & rappels" },
  { icon: Wallet, label: "Paiements", hint: "Cartes & abonnements" },
  { icon: Lock, label: "Confidentialité", hint: "Données & permissions" },
  { icon: HelpCircle, label: "Aide & support", hint: "FAQ, nous contacter" },
];

const Profile = () => {
  const { profile } = useProfile();
  const xpPct = Math.round((profile.xp / 1000) * 100);
  return (
  <AppShell>
    {/* Header / Identity */}
    <section className="relative overflow-hidden rounded-3xl glass shadow-float p-5">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
      <EditProfileModal>
        <button
          aria-label="Modifier le profil"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-background/60 backdrop-blur border border-border/60 hover:bg-background/80 transition-colors"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </EditProfileModal>
      <div className="relative flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-20 w-20 ring-4 ring-background shadow-glow">
            <AvatarImage src={profile.avatar} alt="Avatar" />
            <AvatarFallback className="bg-gradient-primary text-2xl text-primary-foreground">V</AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
            <BadgeCheck className="h-4 w-4" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-xl font-semibold tracking-tight">{profile.name}</h2>
            <Badge className="bg-gradient-primary text-primary-foreground border-transparent">
              <Crown className="mr-1 h-3 w-3" /> Pro
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">Membre depuis 2026 · {profile.location}</p>
          <div className="mt-2 flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`h-3.5 w-3.5 ${i < 5 ? "fill-primary text-primary" : "text-muted"}`} />
            ))}
            <span className="ml-1 text-xs text-muted-foreground">4.9 · 128 avis</span>
          </div>
        </div>
      </div>

      {/* Vital level */}
      <div className="relative mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">Niveau Vital · {profile.level}</span>
          <span className="text-muted-foreground">{profile.xp} / 1000 XP</span>
        </div>
        <Progress value={xpPct} className="h-2" />
        <Link
          to="/profile/edit"
          className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
        >
          <Pencil className="h-3 w-3" /> Modifier mes informations
        </Link>
      </div>
    </section>

    {/* Stats */}
    <section className="mt-4 grid grid-cols-3 gap-3">
      {stats.map(({ label, value, icon: Icon }) => (
        <div key={label} className="rounded-2xl glass shadow-float p-3 text-center">
          <Icon className="mx-auto h-4 w-4 text-primary" />
          <p className="mt-1 text-lg font-semibold leading-tight">{value}</p>
          <p className="text-[11px] text-muted-foreground">{label}</p>
        </div>
      ))}
    </section>

    <BoitesCard />



    {/* Trust & credibility */}
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight">Confiance & crédibilité</h3>
        <span className="text-[11px] text-muted-foreground">Mis à jour aujourd'hui</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {trustItems.map(({ icon: Icon, label, tone }) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-2xl glass shadow-float px-3 py-2.5"
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                tone === "primary"
                  ? "bg-primary/15 text-primary"
                  : tone === "accent"
                    ? "bg-accent/15 text-accent"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="text-xs font-medium">{label}</span>
          </div>
        ))}
      </div>
    </section>

    {/* Referral */}
    <section className="mt-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-5 text-primary-foreground shadow-glow">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            <h3 className="text-base font-semibold">Parrainage</h3>
          </div>
          <p className="mt-1 text-xs opacity-90">
            Invite tes amis · Gagne <span className="font-semibold">10€</span> pour chaque inscription.
          </p>

          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-background/15 backdrop-blur px-3 py-2.5">
            <span className="flex-1 truncate text-sm font-mono tracking-wider">VITAL-USER-26</span>
            <button className="flex h-8 w-8 items-center justify-center rounded-xl bg-background/20 hover:bg-background/30 transition-colors">
              <Copy className="h-4 w-4" />
            </button>
            <button className="flex h-8 items-center gap-1 rounded-xl bg-background text-foreground px-3 text-xs font-semibold hover:opacity-90 transition-opacity">
              <Share2 className="h-3.5 w-3.5" /> Partager
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-background/15 p-2">
              <p className="text-[10px] opacity-80">Invités</p>
              <p className="text-base font-semibold">14</p>
            </div>
            <div className="rounded-xl bg-background/15 p-2">
              <p className="text-[10px] opacity-80">Validés</p>
              <p className="text-base font-semibold">9</p>
            </div>
            <div className="rounded-xl bg-background/15 p-2">
              <p className="text-[10px] opacity-80">Gains</p>
              <p className="text-base font-semibold">90€</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Reviews / feedback */}
    <section className="mt-6">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">Retours utilisateurs</h3>
          <p className="text-[11px] text-muted-foreground">Avis vérifiés sur services, produits & demandes</p>
        </div>
        <button className="text-xs font-medium text-primary inline-flex items-center gap-0.5">
          Tout voir <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* Rating summary */}
      <div className="rounded-2xl glass shadow-float p-4">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold leading-none">4.9</p>
            <div className="mt-1 flex justify-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-primary text-primary" />
              ))}
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">128 avis</p>
          </div>
          <div className="flex-1 space-y-1">
            {[
              { s: 5, v: 88 },
              { s: 4, v: 9 },
              { s: 3, v: 2 },
              { s: 2, v: 1 },
              { s: 1, v: 0 },
            ].map(({ s, v }) => (
              <div key={s} className="flex items-center gap-2">
                <span className="w-3 text-[10px] text-muted-foreground">{s}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${v}%` }} />
                </div>
                <span className="w-6 text-right text-[10px] text-muted-foreground">{v}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { icon: ThumbsUp, label: "Recommandé", value: "98%" },
            { icon: MessageSquareQuote, label: "Réponse", value: "< 1h" },
            { icon: Shield, label: "Litiges", value: "0" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl bg-background/40 p-2 text-center">
              <Icon className="mx-auto h-3.5 w-3.5 text-primary" />
              <p className="mt-1 text-xs font-semibold">{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Review list */}
      <div className="mt-3 space-y-2">
        {reviews.map((r) => (
          <article key={r.name} className="rounded-2xl glass shadow-float p-3.5">
            <div className="flex items-start gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-gradient-primary text-xs text-primary-foreground">
                  {r.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="truncate text-sm font-semibold">{r.name}</p>
                      <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground">{r.role}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{r.date}</span>
                </div>
                <div className="mt-1 flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${i < r.rating ? "fill-primary text-primary" : "text-muted"}`}
                    />
                  ))}
                </div>
                <p className="mt-1.5 flex gap-1 text-xs text-foreground/80">
                  <Quote className="h-3 w-3 shrink-0 text-muted-foreground" />
                  {r.text}
                </p>
              </div>
            </div>
          </article>
        ))}
        <button className="w-full rounded-2xl border border-dashed border-border py-2.5 text-xs font-medium text-muted-foreground hover:bg-accent/10 transition-colors">
          Laisser un avis
        </button>
      </div>
    </section>

    {/* Community */}
    <section className="mt-6 rounded-2xl glass shadow-float p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <Users className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold">Communauté Vitalio</p>
          <p className="text-[11px] text-muted-foreground">Rejoins 24k membres actifs</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </section>

    {/* Settings shortcuts */}
    <section className="mt-6">
      <h3 className="mb-2 text-sm font-semibold tracking-tight">Paramètres du compte</h3>
      <div className="space-y-2">
        {settings.map(({ icon: Icon, label, hint }) => (
          <button
            key={label}
            className="glass shadow-float flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-accent/10"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-medium">{label}</span>
              <span className="block text-[11px] text-muted-foreground">{hint}</span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
        <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
          <LogOut className="h-4 w-4" /> Se déconnecter
        </button>
      </div>
    </section>

    <NotificationPreferences />

    <p className="mt-6 text-center text-[11px] text-muted-foreground">vitalio · v1.0.0</p>
  </AppShell>
  );
};

export default Profile;
