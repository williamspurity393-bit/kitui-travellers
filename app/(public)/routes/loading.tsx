export default function RoutesLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="h-8 w-48 bg-muted rounded-xl mx-auto animate-pulse" />
        <div className="h-4 w-64 bg-muted/60 rounded-lg mx-auto animate-pulse" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 h-11 bg-muted rounded-xl animate-pulse" />
        <div className="h-11 w-36 bg-muted rounded-xl animate-pulse" />
        <div className="h-11 w-40 bg-muted rounded-xl animate-pulse" />
      </div>

      {/* Route cards */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex gap-2">
                    <div className="h-5 w-16 bg-muted rounded-lg animate-pulse" />
                    <div className="h-5 w-20 bg-muted/60 rounded-lg animate-pulse" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-24 bg-muted rounded-lg animate-pulse" />
                    <div className="h-4 w-4 bg-muted/50 rounded animate-pulse" />
                    <div className="h-7 w-24 bg-muted rounded-lg animate-pulse" />
                  </div>
                  <div className="flex gap-3">
                    <div className="h-4 w-16 bg-muted/60 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-muted/60 rounded animate-pulse" />
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="h-8 w-24 bg-muted rounded-lg animate-pulse" />
                  <div className="h-3 w-14 bg-muted/50 rounded animate-pulse" />
                </div>
              </div>
            </div>
            <div className="border-t border-border">
              <div className="px-5 py-3">
                <div className="h-4 w-24 bg-muted/60 rounded animate-pulse" />
              </div>
              {Array.from({ length: 2 }).map((_, j) => (
                <div
                  key={j}
                  className="flex items-center gap-3 px-5 py-3.5 border-t border-border/40"
                >
                  <div className="w-2 h-2 rounded-full bg-muted animate-pulse shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-24 bg-muted/50 rounded animate-pulse" />
                  </div>
                  <div className="h-8 w-16 bg-muted rounded-xl animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
