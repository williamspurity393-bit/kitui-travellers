export default function AdminDashboardLoading() {
  return (
    <div className="p-5 lg:p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded-xl" />
          <div className="h-4 w-40 bg-muted/60 rounded" />
        </div>
        <div className="h-8 w-40 bg-muted/30 rounded-xl" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <div className="h-4 w-4 bg-muted rounded" />
            <div className="h-7 w-20 bg-muted rounded-lg" />
            <div className="h-3 w-24 bg-muted/60 rounded" />
          </div>
        ))}
      </div>

      {/* Chart + quick links */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 h-48" />
        <div className="rounded-2xl border border-border bg-card p-5 h-48" />
      </div>

      {/* Recent bookings */}
      <div className="space-y-2">
        <div className="h-4 w-36 bg-muted/70 rounded" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl border border-border bg-card" />
        ))}
      </div>
    </div>
  );
}
