import { AppShell } from "@/components/layout/AppShell";

const Home = () => (
  <AppShell>
    <section>
      <p className="text-sm uppercase tracking-widest text-muted-foreground">Today</p>
      <h2 className="mt-1 text-3xl font-semibold tracking-tight">Good morning</h2>
      <div className="mt-6 rounded-3xl glass shadow-float p-6">
        <p className="text-sm text-muted-foreground">Daily flash</p>
        <p className="mt-2 text-2xl font-medium">You're glowing today ✨</p>
      </div>
    </section>
  </AppShell>
);

export default Home;
