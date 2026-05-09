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
import { cn } from "@/lib/utils";
import {
  fileToBase64,
  loadDraft,
  saveDraft,
  NAME_REQUIRED_TYPES,
  type SpaceType,
} from "@/lib/spaceStore";
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
  const fileRef = useRef<HTMLInputElement>(null);
  const draftId = useRef<string>(`sp_${Date.now().toString(36)}`);

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
              <h2 className="text-2xl font-semibold tracking-tight">Détails de l'Espace</h2>
              <p className="mt-1 text-sm text-muted-foreground">Étape 2 : description, contacts et préférences (à venir).</p>
            </header>

            <div className="rounded-2xl glass shadow-float p-5 space-y-3">
              <p className="text-sm font-semibold">Récapitulatif</p>
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
              {values.name && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Nom · </span>
                  {values.name}
                </p>
              )}
              {values.locationLabel && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Lieu · </span>
                  {values.locationLabel}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
              Étape 2 disponible bientôt.
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </AppShell>
  );
};

export default CreatePage;
