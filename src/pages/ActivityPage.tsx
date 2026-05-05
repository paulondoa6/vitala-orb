import { AppShell } from "@/components/layout/AppShell";

const ActivityPage = () => (
  <AppShell>
    <h2 className="text-3xl font-semibold tracking-tight">Activity</h2>
    <p className="mt-2 text-muted-foreground">Your recent moves.</p>
    <ul className="mt-6 space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <li key={i} className="rounded-2xl glass shadow-float p-4">
          <p className="text-sm font-medium">Activity {i}</p>
          <p className="text-xs text-muted-foreground">Just now</p>
        </li>
      ))}
    </ul>
  </AppShell>
);

export default ActivityPage;
