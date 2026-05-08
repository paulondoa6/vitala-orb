import { AppShell } from "@/components/layout/AppShell";
import { EditProfileForm } from "@/components/profile/EditProfileForm";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const EditProfile = () => {
  const navigate = useNavigate();
  return (
    <AppShell>
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl glass shadow-float"
          aria-label="Retour"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Modifier mon profil</h1>
          <p className="text-[11px] text-muted-foreground">Aperçu en temps réel · validation instantanée</p>
        </div>
      </div>
      <div className="mt-5">
        <EditProfileForm onDone={() => navigate("/profile")} />
      </div>
    </AppShell>
  );
};

export default EditProfile;
