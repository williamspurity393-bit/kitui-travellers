export default function BookingsLoading() {
  return (
    <div className="p-5 lg:p-8 max-w-3xl mx-auto space-y-6 animate-pulse">
      <div className="space-y-1">
        <div className="h-8 w-40 bg-muted rounded-xl" />
        <div className="h-4 w-32 bg-muted/60 rounded" />
      </div>

      {/* Filter tabs */}
      <div className="h-10 rounded-xl bg-muted" />

      {/* Booking cards */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card"
          >
            <div className="w-9 h-9 rounded-xl bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-28 bg-muted rounded" />
              <div className="h-3 w-48 bg-muted/60 rounded" />
            </div>
            <div className="h-5 w-20 bg-muted rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
