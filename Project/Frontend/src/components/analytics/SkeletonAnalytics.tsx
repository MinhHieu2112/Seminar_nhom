'use client';

export function SkeletonAnalytics() {
  return (
    <div className="animate-pulse space-y-6">
      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-2xl h-28" />
        ))}
      </div>

      {/* Filter bar skeleton */}
      <div className="flex gap-3">
        <div className="bg-gray-100 rounded-2xl h-11 w-72" />
        <div className="bg-gray-100 rounded-2xl h-11 w-40" />
        <div className="ml-auto bg-gray-100 rounded-full h-8 w-24" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-100 rounded-2xl h-80" />
        <div className="bg-gray-100 rounded-2xl h-80" />
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-100 rounded-2xl h-72" />
        <div className="bg-gray-100 rounded-2xl h-72" />
      </div>
    </div>
  );
}
