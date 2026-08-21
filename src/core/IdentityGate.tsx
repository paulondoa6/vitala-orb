import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerIdentityAsker } from "./identity";

type Pending = { reason: string; resolve: (name: string | null) => void } | null;

/**
 * Global, mounted once. Any module can call ensureIdentity("publier un Flash")
 * and this sheet takes care of asking the user's first name — once, kindly.
 */
export const IdentityGate = () => {
  const [pending, setPending] = useState<Pending>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(
    () =>
      registerIdentityAsker((reason, resolve) => {
        setName("");
        setError(null);
        setPending({ reason, resolve });
      }),
    [],
  );

  useEffect(() => {
    if (pending) setTimeout(() => inputRef.current?.focus(), 120);
  }, [pending]);

  const close = useCallback(
    (value: string | null) => {
      pending?.resolve(value);
      setPending(null);
    },
    [pending],
  );

  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending, close]);

  const submit = () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Deux lettres minimum, c'est tout ce qu'on demande.");
      return;
    }
    close(trimmed);
  };

  return (
    <AnimatePresence>
      {pending && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/30 backdrop-blur-sm"
          onClick={() => close(null)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="identity-title"
            initial={{ y: 220 }}
            animate={{ y: 0 }}
            exit={{ y: 220 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="glass shadow-float w-full max-w-md rounded-t-[2rem] px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6"
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border" aria-hidden />
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 id="identity-title" className="mt-4 text-xl font-semibold tracking-tight">
              Comment on t'appelle ?
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Juste ton prénom, pour {pending.reason}. Pas de mot de passe, pas d'e-mail.
            </p>
            <Input
              ref={inputRef}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Ton prénom"
              aria-label="Ton prénom"
              aria-invalid={Boolean(error)}
              className="mt-5 h-12 rounded-2xl text-base"
            />
            {error && (
              <p role="alert" className="mt-2 text-xs text-destructive">
                {error}
              </p>
            )}
            <div className="mt-5 flex gap-2">
              <Button
                variant="ghost"
                className="h-12 flex-1 rounded-2xl"
                onClick={() => close(null)}
              >
                Plus tard
              </Button>
              <Button
                className="h-12 flex-[1.4] rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow"
                onClick={submit}
              >
                C'est parti
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
