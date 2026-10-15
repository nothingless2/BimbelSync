export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse max-w-7xl mx-auto py-2">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800/60 rounded" />
        </div>
        <div className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>

      {/* Filter / Search Bar Skeleton */}
      <div className="flex gap-3">
        <div className="h-10 flex-1 max-w-md bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
        <div className="h-10 w-28 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
      </div>

      {/* Content Table / Cards Skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded mb-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800/50 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-1.5">
                  <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800/50 rounded" />
                </div>
              </div>
              <div className="h-6 w-24 bg-slate-100 dark:bg-slate-800/60 rounded-full" />
              <div className="h-8 w-16 bg-slate-100 dark:bg-slate-800/50 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
