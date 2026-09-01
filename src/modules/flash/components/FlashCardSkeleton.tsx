export const FlashCardSkeleton = ({ large = false }: { large?: boolean }) => (
  <div
    className={`relative w-full overflow-hidden rounded-3xl glass shadow-float p-5 ${
      large ? "h-44" : "h-28"
    }`}
  >
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 space-y-2">
        <div className="h-3 w-20 animate-pulse rounded-full bg-muted" />
        <div className={`animate-pulse rounded-full bg-muted ${large ? "h-6 w-3/4" : "h-5 w-2/3"}`} />
        <div className="h-3 w-16 animate-pulse rounded-full bg-muted" />
      </div>
      <div className={`animate-pulse rounded-full bg-muted ${large ? "h-[72px] w-[72px]" : "h-[52px] w-[52px]"}`} />
    </div>
  </div>
);
