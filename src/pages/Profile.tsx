import { AppShell } from "@/components/layout/AppShell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Profile = () => (
  <AppShell>
    <div className="flex flex-col items-center pt-6">
      <Avatar className="h-20 w-20 ring-4 ring-background shadow-glow">
        <AvatarFallback className="bg-gradient-primary text-2xl text-primary-foreground">V</AvatarFallback>
      </Avatar>
      <h2 className="mt-4 text-2xl font-semibold">Vitala User</h2>
      <p className="text-sm text-muted-foreground">Member since 2026</p>
    </div>
    <div className="mt-8 grid grid-cols-3 gap-3">
      {["Streak", "Scans", "Score"].map((s) => (
        <div key={s} className="rounded-2xl glass shadow-float p-4 text-center">
          <p className="text-xs text-muted-foreground">{s}</p>
          <p className="mt-1 text-xl font-semibold">12</p>
        </div>
      ))}
    </div>
  </AppShell>
);

export default Profile;
