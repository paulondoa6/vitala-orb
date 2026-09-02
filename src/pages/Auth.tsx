import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
  useSession,
} from "@/core/auth";

type Mode = "signin" | "signup";

const message = (e: unknown) => {
  const raw = e instanceof Error ? e.message : "";
  if (raw.includes("Invalid login")) return "Email ou mot de passe incorrect.";
  if (raw.includes("already registered")) return "Ce compte existe déjà, connecte-toi.";
  return raw || "Quelque chose n'a pas fonctionné. Réessaie.";
};

const AuthPage = () => {
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const [mode, setMode] = useState<Mode>("signin");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate("/", { replace: true });
  }, [loading, session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password, firstName.trim());
        toast.success("Compte créé", { description: "Bienvenue sur Vitala." });
      } else {
        await signInWithEmail(email, password);
      }
      navigate("/", { replace: true });
    } catch (err) {
      toast.error("Connexion impossible", { description: message(err) });
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      toast.error("Google indisponible", { description: message(err) });
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Zap className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Vitala</h1>
            <p className="text-sm text-muted-foreground">
              {mode === "signin" ? "Content de te revoir." : "On fait connaissance ?"}
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="firstName">Ton prénom</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Paul"
                autoComplete="given-name"
                required
                minLength={2}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="toi@exemple.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="h-12 w-full" disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Se connecter" : "Créer mon compte"}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          ou
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" className="h-12 w-full" onClick={google} disabled={busy}>
          Continuer avec Google
        </Button>

        <button
          type="button"
          className="mt-6 w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin"
            ? "Pas encore de compte ? Créer un compte"
            : "J'ai déjà un compte — me connecter"}
        </button>
      </motion.div>
    </main>
  );
};

export default AuthPage;
