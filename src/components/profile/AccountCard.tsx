import { useTranslation } from "react-i18next";
import { tc } from "@/core/copy";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, LogOut, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "@/core/auth";

/** Compte : état de connexion et rien d'autre. */
export const AccountCard = () => {
  useTranslation();
  const { session, loading } = useSession();
  const navigate = useNavigate();

  if (loading) return null;

  return (
    <section className="mt-4 rounded-3xl glass shadow-float p-5">
      <h3 className="text-sm font-semibold tracking-tight">{tc("Compte")}</h3>
      {session ? (
        <>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            {session.user.email ?? tc("Connecté")}
          </p>
          <Button
            variant="outline"
            className="mt-4 h-11 w-full"
            onClick={async () => {
              await signOut();
              toast.success(tc("Déconnecté"));
              navigate("/");
            }}
          >
            <LogOut className="mr-2 h-4 w-4" /> {tc("Se déconnecter")}
          </Button>
        </>
      ) : (
        <>
          <p className="mt-1 text-xs text-muted-foreground">
            {tc("Connecte-toi pour retrouver tes flashs, zones et espaces sur tous tes appareils.")}
          </p>
          <Button asChild className="mt-4 h-11 w-full">
            <Link to="/auth">
              <LogIn className="mr-2 h-4 w-4" /> {tc("Se connecter")}
            </Link>
          </Button>
        </>
      )}
    </section>
  );
};
