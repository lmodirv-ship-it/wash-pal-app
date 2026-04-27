export function PageSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030308]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">جاري التحميل...</p>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-12 rounded-lg bg-[hsl(220_25%_10%)] animate-pulse"
        />
      ))}
    </div>
  );
}

export default PageSkeleton;