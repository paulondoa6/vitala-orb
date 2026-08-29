import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, Camera, Check, Loader2, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useIdentity, identitySchema } from "@/core/identity";
import { track } from "@/core/analytics";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read-failed"));
    reader.readAsDataURL(file);
  });

export const IdentityCard = () => {
  const { identity, update } = useIdentity();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [avatar, setAvatar] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFirstName(identity?.firstName ?? "");
    setAvatar(identity?.avatar);
  }, [identity?.firstName, identity?.avatar]);

  const pickAvatar = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Ce fichier n'est pas une image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image trop lourde", { description: "Choisis une photo de moins de 2 Mo." });
      return;
    }
    try {
      setAvatar(await readAsDataUrl(file));
    } catch {
      toast.error("Impossible de lire cette image. Réessaie avec une autre.");
    }
  };

  const save = async () => {
    const parsed = identitySchema.pick({ firstName: true }).safeParse({ firstName });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Prénom invalide");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await update({ firstName: parsed.data.firstName, avatar });
      track({
        name: "profile_updated",
        fields: [
          ...(parsed.data.firstName !== identity?.firstName ? ["firstName"] : []),
          ...(avatar !== identity?.avatar ? ["avatar"] : []),
        ],
      });
      setEditing(false);
      toast.success(`C'est noté, ${parsed.data.firstName}.`);
    } catch {
      toast.error("Ton profil n'a pas pu être enregistré. Réessaie.");
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setFirstName(identity?.firstName ?? "");
    setAvatar(identity?.avatar);
    setError(null);
    setEditing(false);
  };

  const initial = (identity?.firstName ?? "V").charAt(0).toUpperCase();

  return (
    <section className="relative overflow-hidden rounded-3xl glass shadow-float p-5">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-primary opacity-20 blur-3xl" />

      {!editing && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Modifier mon prénom et mon avatar"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background/60 backdrop-blur transition-colors hover:bg-background/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}

      <div className="relative flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-20 w-20 shadow-glow ring-4 ring-background">
            <AvatarImage src={avatar} alt={identity?.firstName ? `Avatar de ${identity.firstName}` : "Avatar"} />
            <AvatarFallback className="bg-gradient-primary text-2xl text-primary-foreground">
              {initial}
            </AvatarFallback>
          </Avatar>

          {editing ? (
            <>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label="Changer ma photo"
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => void pickAvatar(e.target.files?.[0])}
              />
            </>
          ) : (
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
              <BadgeCheck className="h-4 w-4" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {editing ? (
            <div>
              <label htmlFor="firstName" className="text-[11px] font-medium text-muted-foreground">
                Comment on t'appelle ?
              </label>
              <Input
                id="firstName"
                value={firstName}
                autoFocus
                placeholder="Ton prénom"
                onChange={(e) => setFirstName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void save()}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "firstName-error" : undefined}
                className="mt-1 h-10"
              />
              {error && (
                <p id="firstName-error" role="alert" className="mt-1 text-[11px] text-destructive">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="truncate text-xl font-semibold tracking-tight">
                {identity?.firstName ?? "Ton profil"}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {identity?.firstName
                  ? identity.city
                    ? `Sur Vitalio · ${identity.city}`
                    : "Sur Vitalio, en local et hors ligne"
                  : "Ajoute ton prénom pour personnaliser l'app"}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {editing && (
        <div className="relative mt-4 flex gap-2">
          <Button onClick={() => void save()} disabled={saving} className="flex-1 gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Enregistrer
          </Button>
          <Button variant="ghost" onClick={cancel} disabled={saving} className="gap-1.5">
            <X className="h-4 w-4" /> Annuler
          </Button>
        </div>
      )}
    </section>
  );
};
