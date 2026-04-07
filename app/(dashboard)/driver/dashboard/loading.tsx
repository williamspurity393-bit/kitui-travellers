export default function DriverDashboardLoading() {
  return (
    <div className="p-5 lg:p-8 max-w-3xl mx-auto space-y-5 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-8 w-52 bg-muted rounded-xl" />
          <div className="h-4 w-36 bg-muted/60 rounded" />
        </div>
        <div className="h-8 w-32 bg-muted/30 rounded-xl" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-3 space-y-1.5">
            <div className="h-5 w-16 bg-muted rounded mx-auto" />
            <div className="h-3 w-12 bg-muted/50 rounded mx-auto" />
          </div>
        ))}
      </div>

      {/* Active trip card */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 h-48" />

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 rounded-2xl border border-border bg-card" />
        ))}
      </div>
    </div>
  );
}
