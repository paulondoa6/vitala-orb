import { ReactNode, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { TabTransition } from "./TabTransition";
import { AssistantWidget } from "@/components/assistant/AssistantWidget";
import { IdentityGate } from "@/core/IdentityGate";
import { track } from "@/core/analytics";

// Pages où la top-bar n'a pas d'utilité (immersion ou détail avec son propre header)
const isImmersive = (pathname: string) =>
  pathname === "/scan" ||
  /^\/(zone|espace|boite)\/[^/]+/.test(pathname) ||
  pathname === "/profile/edit";

export const AppShell = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const previous = useRef<string | null>(null);

  useEffect(() => {
    if (previous.current === pathname) return;
    track({ name: "tab_switch", from: previous.current, to: pathname });
    previous.current = pathname;
  }, [pathname]);

  const hideTopBar = isImmersive(pathname);

  return (
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col">
      {!hideTopBar && <TopBar />}
      <main className={hideTopBar ? "flex-1 px-5 pb-32 pt-4" : "flex-1 px-5 pb-32 pt-4"}>
        <TabTransition>{children}</TabTransition>
      </main>
      <BottomNav />
      <AssistantWidget />
      <IdentityGate />
    </div>
  );
};
