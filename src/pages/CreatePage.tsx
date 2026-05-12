import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Store,
  Users,
  BadgeCheck,
  Wrench,
  UserPlus,
  Upload,
  MapPin,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Sparkles,
  Plus,
  Trash2,
  Mail,
  ShieldCheck,
  Send,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  fileToBase64,
  loadDraft,
  saveDraft,
  clearDraft,
  NAME_REQUIRED_TYPES,
  type SpaceType,
} from "@/lib/spaceStore";
import { createBoite, type Service, type Member, type MemberRole } from "@/lib/boiteStore";
import { useToast } from "@/hooks/use-toast";

type TypeOption = { id: SpaceType; label: string; hint: string; icon: LucideIcon };

const TYPE_OPTIONS: TypeOption[] = [
  { id: "entreprise", label: "Entreprise", hint: "Société, SARL, SAS", icon: Building2 },
  { id: "boutique", label: "Boutique", hint: "Magasin, e-shop", icon: Store },
  { id: "organisation", label: "Organisation", hint: "Asso, ONG, club", icon: Users },
  { id: "marque", label: "Marque", hint: "Identité, label", icon: BadgeCheck },
  { id: "service", label: "Service proposé", hint: "Offre, prestation", icon: Wrench },
  { id: "equipe", label: "Équipe", hint: "Collectif, staff", icon: UserPlus },
];

const schema = z
  .object({
    types: z.array(z.enum(["entreprise", "boutique", "organisation", "marque", "service", "equipe"])).min(1, "Choisis au moins un type"),
    name: z.string().trim().max(80).optional().or(z.literal("")),
    logo: z.string().optional(),
    locationLabel: z.string().trim().max(120).optional().or(z.literal("")),
    lat: z.number().optional(),
    lng: z.number().optional(),
  })
  .refine(
    (v) => !v.types.some((t) => NAME_REQUIRED_TYPES.includes(t)) || (v.name && v.name.trim().length >= 2),
    { message: "Un nom est requis pour ce type d'espace", path: ["name"] },
  );

type FormValues = z.infer<typeof schema>;

const CreatePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [geoLoading, setGeoLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [error, setError] = useState<{ label: string; message: string } | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberDraft, setMemberDraft] = useState<{ email: string; role: MemberRole }>({ email: "", role: "moderator" });
  const fileRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const draftId = useRef<string>(`sp_${Date.now().toString(36)}`);
  const submittingRef = useRef(false);
  const submittedRef = useRef(false);

  const addService = () =>
    setServices((s) => [...s, { id: `svc_${Date.now().toString(36)}_${s.length}`, name: "", description: "" }]);
  const updateService = (id: string, patch: Partial<Service>) =>
    setServices((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const removeService = (id: string) => setServices((s) => s.filter((x) => x.id !== id));

  const addMember = () => {
    const email = memberDraft.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Email invalide", variant: "destructive" });
      return;
    }
    if (members.some((m) => m.email === email)) {
      toast({ title: "Déjà invité", variant: "destructive" });
      return;
    }
    setMembers((m) => [...m, { id: `mb_${Date.now().toString(36)}`, email, role: memberDraft.role, invitedAt: Date.now() }]);
    setMemberDraft({ email: "", role: memberDraft.role });
  };
  const removeMember = (id: string) => setMembers((m) => m.filter((x) => x.id !== id));

  const { control, register, handleSubmit, watch, setValue, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { types: [], name: "", logo: undefined, locationLabel: "" },
  });

  const values = watch();
  const types = values.types ?? [];
  const needsName = useMemo(() => types.some((t) => NAME_REQUIRED_TYPES.includes(t)), [types]);
  const showOptionalFields = types.length > 0;

  // Load draft once
  useEffect(() => {
    loadDraft().then((d) => {
      if (!d) return;
      draftId.current = d.id;
      setValue("types", d.types);
      setValue("name", d.name ?? "");
      setValue("logo", d.logo);
      setValue("locationLabel", d.location?.label ?? "");
      if (d.location?.lat) setValue("lat", d.location.lat);
      if (d.location?.lng) setValue("lng", d.location.lng);
      setStep(d.step);
    });
  }, [setValue]);

  // Focus management + focus trap + key blocking for the loading dialog
  useEffect(() => {
    if (!submitting) {
      if (lastFocusedRef.current) {
        lastFocusedRef.current.focus?.();
        lastFocusedRef.current = null;
      }
      return;
    }
    lastFocusedRef.current = (document.activeElement as HTMLElement) ?? null;
    requestAnimationFrame(() => dialogRef.current?.focus());

    const onKeyDown = (e: KeyboardEvent) => {
      // Block Escape and Enter from closing/triggering anything during submit
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      // Trap Tab inside the dialog
      if (e.key === "Tab") {
        e.preventDefault();
        dialogRef.current?.focus();
      }
    };
    // Prevent focus from leaving the dialog
    const onFocusIn = (e: FocusEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        e.stopPropagation();
        dialogRef.current.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("focusin", onFocusIn, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("focusin", onFocusIn, true);
    };
  }, [submitting]);

  // Auto-save draft (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      saveDraft({
        id: draftId.current,
        types: values.types ?? [],
        name: values.name || undefined,
        logo: values.logo,
        location:
          values.locationLabel || values.lat
            ? { label: values.locationLabel || undefined, lat: values.lat, lng: values.lng }
            : undefined,
        step,
        updatedAt: Date.now(),
      });
    }, 400);
    return () => clearTimeout(t);
  }, [values, step]);

  const toggleType = (id: SpaceType) => {
    const next = types.includes(id) ? types.filter((t) => t !== id) : [...types, id];
    setValue("types", next, { shouldValidate: true, shouldDirty: true });
  };

  const onLogo = async (file?: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Logo trop lourd", description: "Max 2 Mo.", variant: "destructive" });
      return;
    }
    const b64 = await fileToBase64(file);
    setValue("logo", b64, { shouldDirty: true });
  };

  const geolocate = () => {
    if (!("geolocation" in navigator)) {
      toast({ title: "Géolocalisation indisponible", variant: "destructive" });
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue("lat", pos.coords.latitude, { shouldDirty: true });
        setValue("lng", pos.coords.longitude, { shouldDirty: true });
        const label = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
        if (!values.locationLabel) setValue("locationLabel", label, { shouldDirty: true });
        setGeoLoading(false);
        toast({ title: "Position détectée", description: label });
      },
      (err) => {
        setGeoLoading(false);
        toast({ title: "Échec géolocalisation", description: err.message, variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const onNext = handleSubmit(() => setStep(2));

  const onSubmit = handleSubmit(async (v) => {
    // Guard against double-clicks and resubmits during/after redirect
    if (submittingRef.current || submittedRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    let currentLabel = "Préparation des données…";
    setProgress(4);
    setProgressLabel(currentLabel);
    try {
      const cleanedServices = services
        .map((s) => ({ ...s, name: s.name.trim(), description: s.description?.trim() }))
        .filter((s) => s.name.length > 0);

      const boite = await createBoite(
        {
          types: v.types as SpaceType[],
          name: v.name?.trim() || undefined,
          logo: v.logo,
          location:
            v.locationLabel || v.lat
              ? { label: v.locationLabel || undefined, lat: v.lat, lng: v.lng }
              : undefined,
          services: cleanedServices,
          members,
        },
        (s) => {
          currentLabel = s.label;
          // Cap at 95% so the finalisation step can land on 100
          setProgress(Math.min(95, s.progress));
          setProgressLabel(s.label);
        },
      );

      currentLabel = "Finalisation…";
      setProgress(97);
      setProgressLabel(currentLabel);
      await clearDraft();

      setProgress(100);
      setProgressLabel("Espace créée !");
      toast({ title: "Espace créée !", description: `Numéro unique : ${boite.uuid}` });
      await new Promise((r) => setTimeout(r, 350));
      submittedRef.current = true;
      navigate(`/boite/${boite.uuid}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError({ label: currentLabel, message });
      setProgress(0);
      setProgressLabel("");
      setSubmitting(false);
      submittingRef.current = false;
      toast({
        title: "Échec de création",
        description: `${currentLabel} — ${message}`,
        variant: "destructive",
      });
    }
  });

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={() => (step === 2 ? setStep(1) : navigate(-1))}
          className="flex h-9 w-9 items-center justify-center rounded-xl glass shadow-float"
          aria-label="Retour"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight">Création d'Espace</h1>
          <p className="text-[11px] text-muted-foreground">Étape {step}/2 · auto-sauvegarde</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("h-1.5 w-6 rounded-full transition-colors", step >= 1 ? "bg-primary" : "bg-muted")} />
          <span className={cn("h-1.5 w-6 rounded-full transition-colors", step >= 2 ? "bg-primary" : "bg-muted")} />
        </div>
      </div>

      <fieldset disabled={submitting} aria-busy={submitting} className="m-0 min-w-0 border-0 p-0">
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.section
            key="step1"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mt-6 space-y-6"
          >
            <header>
              <h2 className="text-2xl font-semibold tracking-tight">Quel type d'Espace voulez-vous créer ?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sélectionne un ou plusieurs types. Tu pourras ajouter des détails ensuite.
              </p>
            </header>

            {/* Type cards */}
            <div className="grid grid-cols-2 gap-3">
              {TYPE_OPTIONS.map(({ id, label, hint, icon: Icon }) => {
                const checked = types.includes(id);
                return (
                  <motion.button
                    key={id}
                    type="button"
                    onClick={() => toggleType(id)}
                    whileTap={{ scale: 0.97 }}
                    aria-pressed={checked}
                    className={cn(
                      "group relative flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all",
                      "glass shadow-float",
                      checked
                        ? "border-primary/60 ring-2 ring-primary/40"
                        : "border-border/60 hover:border-primary/30",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                        checked ? "bg-gradient-primary text-primary-foreground" : "bg-muted text-foreground/70",
                      )}
                    >
                      <Icon className="h-5 w-5" strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight">{label}</p>
                      <p className="text-[11px] text-muted-foreground">{hint}</p>
                    </div>
                    <span
                      className={cn(
                        "absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border transition-all",
                        checked ? "border-transparent bg-primary text-primary-foreground" : "border-border bg-background/60",
                      )}
                    >
                      {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                  </motion.button>
                );
              })}
            </div>
            {formState.errors.types && (
              <p className="text-xs text-destructive">{formState.errors.types.message as string}</p>
            )}

            {/* Conditional fields */}
            <AnimatePresence>
              {showOptionalFields && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  {/* Name */}
                  <div className="rounded-2xl glass shadow-float p-4 space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2 text-sm">
                      Avez-vous un nom ?
                      {needsName && <span className="text-[10px] font-medium text-primary">requis</span>}
                    </Label>
                    <Input
                      id="name"
                      placeholder="Ex. Vitalio Studio"
                      maxLength={80}
                      {...register("name")}
                      className="bg-background/60"
                    />
                    {formState.errors.name && (
                      <p className="text-xs text-destructive">{formState.errors.name.message}</p>
                    )}
                  </div>

                  {/* Logo */}
                  <div className="rounded-2xl glass shadow-float p-4">
                    <Label className="text-sm">Un logo ?</Label>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-muted">
                        {values.logo ? (
                          <img src={values.logo} alt="Logo" className="h-full w-full object-cover" />
                        ) : (
                          <Sparkles className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => onLogo(e.target.files?.[0])}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileRef.current?.click()}
                          className="rounded-xl"
                        >
                          <Upload className="mr-1 h-3.5 w-3.5" />
                          {values.logo ? "Changer" : "Importer"}
                        </Button>
                        {values.logo && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setValue("logo", undefined, { shouldDirty: true })}
                            className="ml-1 rounded-xl text-muted-foreground"
                          >
                            <X className="mr-1 h-3.5 w-3.5" /> Retirer
                          </Button>
                        )}
                        <p className="text-[10px] text-muted-foreground">PNG, JPG · max 2 Mo</p>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="rounded-2xl glass shadow-float p-4 space-y-2">
                    <Label htmlFor="loc" className="text-sm">
                      Vous êtes localisable ?
                    </Label>
                    <div className="flex gap-2">
                      <Controller
                        control={control}
                        name="locationLabel"
                        render={({ field }) => (
                          <Input
                            id="loc"
                            placeholder="Ville, adresse ou coordonnées"
                            {...field}
                            value={field.value ?? ""}
                            className="bg-background/60"
                          />
                        )}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={geolocate}
                        disabled={geoLoading}
                        className="shrink-0 rounded-xl"
                      >
                        {geoLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MapPin className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {values.lat && values.lng && (
                      <p className="text-[10px] text-muted-foreground">
                        Position : {values.lat.toFixed(4)}, {values.lng.toFixed(4)}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sticky CTA */}
            <div className="sticky bottom-24 pt-2">
              <Button
                type="button"
                onClick={onNext}
                disabled={!formState.isValid}
                className="h-12 w-full rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow disabled:opacity-50"
              >
                Suivant
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </motion.section>
        ) : (
          <motion.section
            key="step2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mt-6 space-y-4"
          >
            <header>
              <h2 className="text-2xl font-semibold tracking-tight">Services & équipe</h2>
              <p className="mt-1 text-sm text-muted-foreground">Configure tes services et invite ton personnel.</p>
            </header>

            {/* Récap */}
            <div className="rounded-2xl glass shadow-float p-4 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {types.map((t) => {
                  const opt = TYPE_OPTIONS.find((o) => o.id === t)!;
                  return (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
                    >
                      <opt.icon className="h-3 w-3" /> {opt.label}
                    </span>
                  );
                })}
              </div>
              {values.name && <p className="text-sm font-medium">{values.name}</p>}
            </div>

            {/* Services */}
            <section className="rounded-2xl glass shadow-float p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Vos services</p>
                  <p className="text-[11px] text-muted-foreground">Ajoute ce que tu proposes</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addService}
                  className="rounded-xl"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter
                </Button>
              </div>

              <AnimatePresence initial={false}>
                {services.map((svc, idx) => (
                  <motion.div
                    key={svc.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    className="rounded-xl border border-border/60 bg-background/40 p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-[10px] font-semibold">
                        {idx + 1}
                      </span>
                      <Input
                        value={svc.name}
                        onChange={(e) => updateService(svc.id, { name: e.target.value })}
                        placeholder="Nom du service"
                        maxLength={80}
                        className="h-9 bg-background/60"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeService(svc.id)}
                        aria-label="Supprimer"
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={svc.description ?? ""}
                      onChange={(e) => updateService(svc.id, { description: e.target.value })}
                      placeholder="Description courte"
                      maxLength={400}
                      rows={2}
                      className="resize-none bg-background/60 text-sm"
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {services.length === 0 && (
                <p className="rounded-xl border border-dashed border-border/60 p-3 text-center text-xs text-muted-foreground">
                  Aucun service · facultatif
                </p>
              )}
            </section>

            {/* Personnel */}
            <section className="rounded-2xl glass shadow-float p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold">Votre personnel</p>
                <p className="text-[11px] text-muted-foreground">Invite par email · rôle Admin ou Modérateur</p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    value={memberDraft.email}
                    onChange={(e) => setMemberDraft((d) => ({ ...d, email: e.target.value }))}
                    placeholder="email@exemple.com"
                    className="h-10 bg-background/60 pl-9"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addMember();
                      }
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex rounded-xl border border-border/60 bg-background/40 p-0.5">
                    {(["admin", "moderator"] as MemberRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setMemberDraft((d) => ({ ...d, role: r }))}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                          memberDraft.role === r
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {r === "admin" ? "Admin" : "Modérateur"}
                      </button>
                    ))}
                  </div>
                  <Button type="button" onClick={addMember} className="rounded-xl">
                    <Send className="mr-1 h-3.5 w-3.5" /> Inviter
                  </Button>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {members.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 8 }}
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
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{m.email}</p>
                      <p className="text-[10px] capitalize text-muted-foreground">
                        {m.role === "admin" ? "Admin" : "Modérateur"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMember(m.id)}
                      aria-label="Retirer"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </section>

            {/* Error retry banner */}
            <AnimatePresence>
              {error && !submitting && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  role="alert"
                  className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm"
                >
                  <p className="font-semibold text-destructive">Échec à l'étape : {error.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{error.message}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Tes informations sont conservées. Tu peux réessayer.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={onSubmit}
                      className="rounded-xl bg-gradient-primary text-primary-foreground"
                    >
                      Réessayer
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setError(null)}
                      className="rounded-xl"
                    >
                      Fermer
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA */}
            <div className="sticky bottom-24 grid grid-cols-3 gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                disabled={submitting}
                className="h-12 rounded-2xl"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                onClick={onSubmit}
                disabled={submitting}
                aria-busy={submitting}
                className="col-span-2 h-12 rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {progress < 100 ? `Création… ${progress}%` : "Redirection…"}
                  </>
                ) : (
                  <>
                    Créer l'Espace
                    <Sparkles className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
      </fieldset>

      {/* Progress overlay */}
      <AnimatePresence>
        {submitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-progress-label"
            aria-describedby="create-progress-percent"
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm"
          >
            <motion.div
              ref={dialogRef}
              tabIndex={-1}
              initial={{ scale: 0.95, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              className="w-[88%] max-w-sm rounded-2xl glass shadow-float p-6 text-center outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
                {progress < 100 ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <Check className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
                )}
              </div>
              <p
                id="create-progress-label"
                aria-live="polite"
                aria-atomic="true"
                className="text-sm font-semibold"
              >
                {progressLabel || "Création en cours…"}
              </p>
              <div
                className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                aria-valuetext={`${progress}%`}
              >
                <motion.div
                  className="h-full rounded-full bg-gradient-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 20 }}
                />
              </div>
              <p
                id="create-progress-percent"
                aria-live="polite"
                aria-atomic="true"
                className="mt-2 text-[11px] tabular-nums text-muted-foreground"
              >
                {progress}%
              </p>
              <span className="sr-only" aria-live="assertive">
                {progress === 100 ? "Création terminée, redirection en cours" : ""}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
};

export default CreatePage;
