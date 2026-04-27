export function PageSkeleton() {
  return (
    <div className="w-full space-y-4">
      <div className="h-8 w-56 rounded-lg skeleton-shimmer" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl skeleton-shimmer" />
        ))}
      </div>
      <div className="h-72 rounded-xl skeleton-shimmer" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
            className="h-12 rounded-lg skeleton-shimmer"
        />
      ))}
    </div>
  );
}

export default PageSkeleton;