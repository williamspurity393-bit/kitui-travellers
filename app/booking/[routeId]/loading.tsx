import { Loader2 } from "lucide-react";

export default function BookingPageLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="size-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-mono">Loading booking details…</p>
      </div>
    </div>
  );
}
