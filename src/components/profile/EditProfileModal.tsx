import { useTranslation } from "react-i18next";
import { tc } from "@/core/copy";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ReactNode, useState } from "react";
import { EditProfileForm } from "./EditProfileForm";

export const EditProfileModal = ({ children }: { children: ReactNode }) => {
  useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tc("Modifier mon profil")}</DialogTitle>
        </DialogHeader>
        <EditProfileForm onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};
