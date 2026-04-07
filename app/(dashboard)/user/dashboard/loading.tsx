export default function UserDashboardLoading() {
  return (
    <div className="p-5 lg:p-8 max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-28 bg-muted rounded" />
        <div className="h-8 w-64 bg-muted rounded-xl" />
        <div className="h-4 w-48 bg-muted/60 rounded" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <div className="h-4 w-4 bg-muted rounded" />
            <div className="h-7 w-16 bg-muted rounded-lg" />
            <div className="h-3 w-20 bg-muted/60 rounded" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <div className="h-4 w-32 bg-muted/70 rounded" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl border border-border bg-card" />
        ))}
      </div>
    </div>
  );
}
