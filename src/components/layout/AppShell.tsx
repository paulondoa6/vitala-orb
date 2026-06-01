import { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { TabTransition } from "./TabTransition";
import { AssistantWidget } from "@/components/assistant/AssistantWidget";

export const AppShell = ({ children }: { children: ReactNode }) => {
  return (
    <div className="relative mx-auto flex min-h-screen max-w-md flex-col">
      <TopBar />
      <main className="flex-1 px-5 pb-32 pt-4">
        <TabTransition>{children}</TabTransition>
      </main>
      <BottomNav />
      <AssistantWidget />
    </div>
  );
};
