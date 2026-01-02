import { Skeleton } from "./ui/skeleton";

export function NftCardSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-white/10 bg-white/5">
      <Skeleton className="aspect-square w-full rounded-lg mb-3" />
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}
