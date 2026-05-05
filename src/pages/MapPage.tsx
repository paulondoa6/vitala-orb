import { AppShell } from "@/components/layout/AppShell";

const MapPage = () => (
  <AppShell>
    <h2 className="text-3xl font-semibold tracking-tight">Map</h2>
    <p className="mt-2 text-muted-foreground">Discover places around you.</p>
    <div className="mt-6 h-[60vh] rounded-3xl glass shadow-float" />
  </AppShell>
);

export default MapPage;
