import { ReactNode, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { TabTransition } from "./TabTransition";
import { AssistantWidget } from "@/components/assistant/AssistantWidget";
import { IdentityGate } from "@/core/IdentityGate";
import { track } from "@/core/analytics";

export const AppShell = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const previous = useRef<string | null>(null);

  useEffect(() => {
    if (previous.current === pathname) return;
    track({ name: "tab_switch", from: previous.current, to: pathname });
    previous.current = pathname;
  }, [pathname]);

  return (
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col">
      <TopBar />
      <main className="flex-1 px-5 pb-32 pt-4">
        <TabTransition>{children}</TabTransition>
      </main>
      <BottomNav />
      <AssistantWidget />
      <IdentityGate />
    </div>
  );
};
