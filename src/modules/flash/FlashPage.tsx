import { useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState, ErrorState, PageHeader, SectionLabel } from "@/components/layout/PageScaffold";
import { FlashCardSkeleton } from "./components/FlashCardSkeleton";
import { Zap } from "lucide-react";
import { toast } from "sonner";
import type { Flash } from "@/core/db";
import { closeFlash } from "./api";
import { useFlashFeed } from "./hooks";
import { FlashComposer } from "./components/FlashComposer";
import { FlashPublished } from "./components/FlashPublished";
import { FlashItemCard } from "./components/FlashItemCard";

const FlashPage = () => {
  const { mine, around, liveCount, loading, error, reload } = useFlashFeed();
  const [published, setPublished] = useState<Flash | null>(null);
  const aroundRef = useRef<HTMLDivElement>(null);

  const onClose = async (id: string) => {
    await closeFlash(id);
    toast.success("Flash clôturé", { description: "Il n'apparaît plus autour de toi." });
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Flash"
        title={
          <>
            Dis ce dont tu as besoin,{" "}
            <span className="italic font-normal text-primary">on s'occupe du reste</span>
          </>
        }
        subtitle="Publie en cinq secondes. Les personnes proches le voient tout de suite."
      />

      <div className="mt-5">
        {published ? (
          <FlashPublished
            flash={published}
            onNew={() => setPublished(null)}
            onSeeFeed={() => {
              setPublished(null);
              aroundRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
        ) : (
          <FlashComposer
            onPublished={(flash) => {
              setPublished(flash);
              reload();
            }}
          />
        )}
      </div>

      {error ? (
        <div className="mt-6">
          <ErrorState title="Flux indisponible" description={error} onRetry={reload} />
        </div>
      ) : loading ? (
        <div className="mt-6 space-y-3">
          <FlashCardSkeleton large />
          <FlashCardSkeleton />
          <FlashCardSkeleton />
        </div>
      ) : (
        <>
          {mine.length > 0 && (
            <>
              <SectionLabel label="Le tien" trailing={`${mine.length} en cours`} />
              <div className="mt-3 space-y-3">
                {mine.map((f, i) => (
                  <FlashItemCard key={f.id} flash={f} index={i} owned onClose={onClose} />
                ))}
              </div>
            </>
          )}

          <div ref={aroundRef} className="scroll-mt-24">
            <SectionLabel
              label="Autour de toi"
              trailing={liveCount > 0 ? `${liveCount} en direct` : undefined}
            />
          </div>
          <div className="mt-3 space-y-3 pb-4">
            {around.length === 0 ? (
              <EmptyState
                icon={<Zap className="h-5 w-5" />}
                title="C'est calme par ici"
                description="Personne n'a publié récemment. Lance le premier flash, ça réveille le quartier."
              />
            ) : (
              around.map((f, i) => <FlashItemCard key={f.id} flash={f} index={i} />)
            )}
          </div>
        </>
      )}
    </AppShell>
  );
};

export default FlashPage;
