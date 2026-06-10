import { Skeleton } from "@/components/layout/PageScaffold";

export const ListRowSkeleton = () => (
  <div className="flex items-center gap-3 rounded-2xl glass shadow-float p-4">
    <Skeleton className="h-10 w-10 rounded-xl" />
    <div className="min-w-0 flex-1 space-y-2">
      <Skeleton className="h-3.5 w-2/3 rounded-full" />
      <Skeleton className="h-2.5 w-1/3 rounded-full" />
    </div>
    <Skeleton className="h-2.5 w-10 rounded-full" />
  </div>
);

export const MapSkeleton = () => (
  <div className="relative h-[55vh] overflow-hidden rounded-3xl glass shadow-float">
    <Skeleton className="absolute inset-0 rounded-3xl" />
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
      <Skeleton className="h-12 w-12 rounded-2xl" />
      <Skeleton className="h-3 w-32 rounded-full" />
      <Skeleton className="h-2.5 w-20 rounded-full" />
    </div>
  </div>
);

export const ProfileSkeleton = () => (
  <div className="space-y-4">
    <div className="rounded-3xl glass shadow-float p-5">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2 rounded-full" />
          <Skeleton className="h-3 w-2/3 rounded-full" />
          <Skeleton className="h-3 w-1/3 rounded-full" />
        </div>
      </div>
      <Skeleton className="mt-5 h-2 w-full rounded-full" />
    </div>
    <div className="grid grid-cols-3 gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl glass shadow-float p-3 space-y-2">
          <Skeleton className="mx-auto h-4 w-4 rounded-full" />
          <Skeleton className="mx-auto h-4 w-10 rounded-full" />
          <Skeleton className="mx-auto h-2.5 w-12 rounded-full" />
        </div>
      ))}
    </div>
    <ListRowSkeleton />
    <ListRowSkeleton />
  </div>
);
