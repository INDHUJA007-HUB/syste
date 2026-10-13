import React from 'react';

export const CardSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-800/80 animate-pulse">
      <div className="aspect-[2/3] skeleton-shimmer w-full" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-slate-800 rounded w-3/4 skeleton-shimmer" />
        <div className="h-2.5 bg-slate-800 rounded w-1/2 skeleton-shimmer" />
      </div>
    </div>
  );
};

export const CarouselSkeleton: React.FC = () => {
  return (
    <div className="py-4 px-4 sm:px-6 lg:px-8 space-y-3">
      <div className="h-5 bg-slate-800 rounded w-48 skeleton-shimmer" />
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex-shrink-0 w-36 sm:w-44 md:w-52">
            <CardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
};

export const HeroSkeleton: React.FC = () => {
  return (
    <div className="w-full h-[65vh] bg-slate-900 relative skeleton-shimmer">
      <div className="absolute bottom-16 left-8 space-y-3 max-w-xl">
        <div className="h-10 bg-slate-800 rounded w-3/4" />
        <div className="h-4 bg-slate-800 rounded w-full" />
        <div className="h-4 bg-slate-800 rounded w-2/3" />
        <div className="flex gap-3 pt-4">
          <div className="h-11 w-32 bg-slate-800 rounded-xl" />
          <div className="h-11 w-32 bg-slate-800 rounded-xl" />
        </div>
      </div>
    </div>
  );
};
