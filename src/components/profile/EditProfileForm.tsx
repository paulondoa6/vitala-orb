import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Camera, MapPin, User, Crown, Check, AlertCircle } from "lucide-react";
import { useProfile, profileSchema, type Profile } from "@/lib/profileStore";
import { toast } from "@/hooks/use-toast";

export const EditProfileForm = ({ onDone }: { onDone?: () => void }) => {
  const { profile, update } = useProfile();
  const [draft, setDraft] = useState<Profile>(profile);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const onPick = (f?: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setErrors((e) => ({ ...e, avatar: "Image uniquement" }));
      return;
    }
    if (f.size > 3 * 1024 * 1024) {
      setErrors((e) => ({ ...e, avatar: "Max 3 Mo" }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set("avatar", String(reader.result));
    reader.readAsDataURL(f);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = profileSchema.safeParse(draft);
    if (!res.success) {
      const flat: Record<string, string> = {};
      res.error.issues.forEach((i) => {
        flat[String(i.path[0])] = i.message;
      });
      setErrors(flat);
      return;
    }
    update(res.data);
    toast({ title: "Profil mis à jour", description: "Tes informations ont été sauvegardées." });
    onDone?.();
  };

  const initials = draft.name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Live preview */}
      <div className="relative overflow-hidden rounded-2xl glass shadow-float p-4">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative"
            aria-label="Changer la photo"
          >
            <Avatar className="h-16 w-16 ring-4 ring-background shadow-glow">
              <AvatarImage src={draft.avatar} alt="Aperçu" />
              <AvatarFallback className="bg-gradient-primary text-lg text-primary-foreground">
                {initials || "V"}
              </AvatarFallback>
            </Avatar>
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-5 w-5" />
            </span>
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
              <Camera className="h-3 w-3" />
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{draft.name || "—"}</p>
            <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3" /> {draft.location || "—"}
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-primary">
              <Crown className="h-3 w-3" /> Niveau {draft.level} · {draft.xp} XP
            </p>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0])}
        />
        {errors.avatar && (
          <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-destructive">
            <AlertCircle className="h-3 w-3" /> {errors.avatar}
          </p>
        )}
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-xs">
          <User className="mr-1 inline h-3 w-3" /> Nom complet
        </Label>
        <Input
          id="name"
          value={draft.name}
          maxLength={40}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Prénom Nom"
          aria-invalid={!!errors.name}
        />
        {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
      </div>

      {/* Location */}
      <div className="space-y-1.5">
        <Label htmlFor="location" className="text-xs">
          <MapPin className="mr-1 inline h-3 w-3" /> Localisation
        </Label>
        <Input
          id="location"
          value={draft.location}
          maxLength={60}
          onChange={(e) => set("location", e.target.value)}
          placeholder="Ville, Pays"
          aria-invalid={!!errors.location}
        />
        {errors.location && <p className="text-[11px] text-destructive">{errors.location}</p>}
      </div>

      {/* Level */}
      <div className="space-y-2 rounded-2xl bg-muted/40 p-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs">
            <Crown className="mr-1 inline h-3 w-3" /> Niveau Vital
          </Label>
          <span className="text-xs font-semibold text-primary">Niv. {draft.level}</span>
        </div>
        <Slider
          value={[draft.level]}
          min={1}
          max={20}
          step={1}
          onValueChange={(v) => set("level", v[0])}
        />
        <div className="flex items-center justify-between pt-1">
          <Label className="text-xs">XP</Label>
          <span className="text-xs font-semibold">{draft.xp} / 1000</span>
        </div>
        <Slider
          value={[draft.xp]}
          min={0}
          max={1000}
          step={10}
          onValueChange={(v) => set("xp", v[0])}
        />
      </div>

      <div className="flex gap-2 pt-2">
        {onDone && (
          <Button type="button" variant="ghost" className="flex-1" onClick={onDone}>
            Annuler
          </Button>
        )}
        <Button type="submit" className="flex-1 bg-gradient-primary text-primary-foreground hover:opacity-90">
          <Check className="h-4 w-4" /> Enregistrer
        </Button>
      </div>
    </form>
  );
};
