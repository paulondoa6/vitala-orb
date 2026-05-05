import { AppShell } from "@/components/layout/AppShell";

const Scan = () => (
  <AppShell>
    <h2 className="text-3xl font-semibold tracking-tight">Scan</h2>
    <p className="mt-2 text-muted-foreground">Point your camera to begin.</p>
    <div className="mt-6 flex h-[60vh] items-center justify-center rounded-3xl glass shadow-float">
      <span className="text-sm text-muted-foreground">Camera viewport</span>
    </div>
  </AppShell>
);

export default Scan;
