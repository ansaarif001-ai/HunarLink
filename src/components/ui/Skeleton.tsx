import React from 'react';

export const SkeletonBlock: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => (
  <div
    aria-hidden="true"
    className={`animate-pulse motion-reduce:animate-none rounded-xl bg-[#E2E8F0] ${className}`}
  />
);

export const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <div className="min-h-[60vh] space-y-3" aria-busy="true">
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="rounded-2xl border border-[#E3EAF3] bg-white p-5 space-y-3"
      >
        <div className="flex items-center justify-between gap-4">
          <SkeletonBlock className="h-5 w-1/2" />
          <SkeletonBlock className="h-5 w-20" />
        </div>
        <SkeletonBlock className="h-4 w-3/4" />
        <SkeletonBlock className="h-4 w-1/3" />
      </div>
    ))}
  </div>
);

export const CardGridSkeleton: React.FC<{ cards?: number }> = ({ cards = 6 }) => (
  <div className="grid min-h-[60vh] grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">
    {Array.from({ length: cards }).map((_, i) => (
      <div
        key={i}
        className="rounded-2xl border border-[#E3EAF3] bg-white p-5 space-y-4"
      >
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-14 w-14 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-5 w-2/3" />
            <SkeletonBlock className="h-4 w-1/2" />
          </div>
        </div>
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-11 w-full rounded-xl" />
      </div>
    ))}
  </div>
);

export const ProfileSkeleton: React.FC = () => (
  <div className="mx-auto min-h-[60vh] max-w-3xl space-y-6" aria-busy="true">
    <div className="overflow-hidden rounded-2xl border border-[#E3EAF3] bg-white">
      <SkeletonBlock className="h-36 w-full rounded-none sm:h-44" />
      <div className="px-6 pb-6">
        <div className="-mt-12 flex items-end justify-between gap-4">
          <SkeletonBlock className="h-24 w-24 rounded-full border-4 border-white" />
          <SkeletonBlock className="h-11 w-32 rounded-xl" />
        </div>
        <div className="mt-4 space-y-2.5">
          <SkeletonBlock className="h-7 w-48" />
          <SkeletonBlock className="h-5 w-64" />
          <SkeletonBlock className="h-4 w-40" />
        </div>
      </div>
    </div>
    <ListSkeleton rows={2} />
  </div>
);

export const PageSkeleton: React.FC = () => (
  <div className="mx-auto min-h-[70vh] max-w-[1200px] space-y-6 px-4 py-6 sm:px-6" aria-busy="true">
    <SkeletonBlock className="h-24 w-full rounded-2xl" />
    <CardGridSkeleton cards={3} />
  </div>
);
