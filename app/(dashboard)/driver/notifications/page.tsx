"use client";

import React from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Bell,
  CheckCheck,
  Trash2,
  Loader2,
  CreditCard,
  Bus,
  AlertCircle,
  Info,
  Check,
  ChevronRight,
  Cpu,
  Navigation,
  Star,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

// ── Type map ──────────────────────────────────────────────────
const TYPE_META: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    label: string;
  }
> = {
  booking_confirmed: { icon: Bus, color: "text-blue-400 bg-blue-400/10", label: "New Booking" },
  booking_cancelled: {
    icon: AlertCircle,
    color: "text-destructive bg-destructive/10",
    label: "Cancellation",
  },
  payment_received: {
    icon: CreditCard,
    color: "text-emerald-400 bg-emerald-400/10",
    label: "Earning",
  },
  payment_failed: {
    icon: AlertCircle,
    color: "text-destructive bg-destructive/10",
    label: "Payment Issue",
  },
  trip_reminder: { icon: Bus, color: "text-amber-400 bg-amber-400/10", label: "Reminder" },
  trip_started: { icon: Navigation, color: "text-blue-400 bg-blue-400/10", label: "Trip Started" },
  trip_completed: { icon: Check, color: "text-emerald-400 bg-emerald-400/10", label: "Completed" },
  system: { icon: Info, color: "text-muted-foreground bg-muted", label: "System" },
  promo: { icon: Tag, color: "text-purple-400 bg-purple-400/10", label: "Promo" },
  review_request: { icon: Star, color: "text-amber-400 bg-amber-400/10", label: "Review" },
};

const AGENT_TYPES = new Set(["trip_reminder", "trip_started", "trip_completed"]);

function getDetailLink(n: {
  type: string;
  data?: Record<string, unknown> | null;
}): { href: string; label: string } | null {
  const d = (n.data ?? {}) as Record<string, unknown>;
  if (AGENT_TYPES.has(n.type) || d.scheduleId)
    return { href: "/driver/schedule", label: "View Schedule" };
  if (n.type === "payment_received" || d.earningId)
    return { href: "/driver/earnings", label: "View Earnings" };
  if (n.type === "booking_confirmed" || n.type === "booking_cancelled")
    return { href: "/driver/passengers", label: "View Passengers" };
  return null;
}

// ── Page ──────────────────────────────────────────────────────
export default function DriverNotificationsPage() {
  const { isAuthenticated } = useConvexAuth();

  // Use the driver-scoped query
  const notifications = useQuery(
    api.notifications.getDriverNotifications,
    !isAuthenticated ? "skip" : {}
  );

  const markRead = useMutation(api.notifications.markAsRead);
  const markAll = useMutation(api.notifications.markAllAsRead);
  const deleteOne = useMutation(api.notifications.deleteNotification);
  const clearAll = useMutation(api.notifications.clearAllNotifications);

  const [pending, setPending] = React.useState<string | null>(null);

  const list = (notifications ?? []) as any[];
  const unread = list.filter((n) => !n.isRead).length;

  // Group: unread first, then earlier
  const unreadList = list.filter((n) => !n.isRead);
  const readList = list.filter((n) => n.isRead);

  return (
    <div className="p-5 lg:p-8 max-w-2xl mx-auto space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1
            className="text-2xl font-black text-foreground"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {unread > 0 ? `${unread} unread` : "All caught up"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button
              onClick={() => markAll({}).catch(() => toast.error("Failed to mark as read"))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-medium hover:bg-muted transition-colors"
            >
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
          )}
          {list.length > 0 && (
            <button
              onClick={() => {
                if (!confirm("Delete all notifications?")) return;
                clearAll({})
                  .then(() => toast.success("All cleared"))
                  .catch(() => toast.error("Failed"));
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-destructive/20 text-destructive text-xs font-medium hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="size-3.5" /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {notifications === undefined ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 text-primary animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <Bell className="size-8 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="font-semibold text-foreground">All caught up</p>
          <p className="text-sm text-muted-foreground mt-1">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-5">
          {unreadList.length > 0 && (
            <section className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1">
                Unread · {unreadList.length}
              </p>
              <NotifList
                items={unreadList}
                pending={pending}
                setPending={setPending}
                markRead={markRead}
                deleteOne={deleteOne}
                getLink={getDetailLink}
              />
            </section>
          )}
          {readList.length > 0 && (
            <section className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1">
                Earlier
              </p>
              <NotifList
                items={readList}
                pending={pending}
                setPending={setPending}
                markRead={markRead}
                deleteOne={deleteOne}
                getLink={getDetailLink}
              />
            </section>
          )}
        </div>
      )}
    </div>
  );
}

// ── Shared card list ──────────────────────────────────────────
function NotifList({
  items,
  pending,
  setPending,
  markRead,
  deleteOne,
  getLink,
}: {
  items: any[];
  pending: string | null;
  setPending: (id: string | null) => void;
  markRead: ReturnType<typeof useMutation>;
  deleteOne: ReturnType<typeof useMutation>;
  getLink: (n: any) => { href: string; label: string } | null;
}) {
  return (
    <>
      {items.map((n) => {
        const meta = TYPE_META[n.type] ?? TYPE_META.system;
        const Icon = meta.icon;
        const isPend = pending === n._id;
        const isAgent = AGENT_TYPES.has(n.type);
        const detail = getLink(n);

        return (
          <div
            key={n._id}
            className={cn(
              "rounded-2xl border transition-all",
              n.isRead ? "border-border bg-card" : "border-primary/20 bg-primary/5"
            )}
          >
            <div
              className="flex items-start gap-3 p-4 cursor-pointer"
              onClick={() => {
                if (!n.isRead) {
                  setPending(n._id);
                  markRead({ notificationId: n._id as Id<"notifications"> }).finally(() =>
                    setPending(null)
                  );
                }
              }}
            >
              {/* Icon */}
              <div
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 relative",
                  meta.color
                )}
              >
                <Icon className="size-4" />
                {isAgent && (
                  <Cpu className="size-2.5 text-violet-400 absolute -top-0.5 -right-0.5" />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={cn("text-sm", n.isRead ? "font-medium" : "font-bold")}>{n.title}</p>
                  <span
                    className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded-full font-medium border shrink-0",
                      meta.color,
                      "border-current/20"
                    )}
                  >
                    {meta.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] text-muted-foreground/60">
                    {new Date(n.createdAt).toLocaleString("en-KE", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {isAgent && (
                    <span className="text-[10px] text-violet-400/70 flex items-center gap-0.5">
                      <Cpu className="size-2.5" /> auto
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary" />}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPending(n._id);
                    deleteOne({ notificationId: n._id as Id<"notifications"> }).finally(() =>
                      setPending(null)
                    );
                  }}
                  className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  {isPend ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Trash2 className="size-3" />
                  )}
                </button>
              </div>
            </div>

            {/* Deep-link */}
            {detail && (
              <div className="px-4 pb-3">
                <Link
                  href={detail.href}
                  className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
                >
                  <ChevronRight className="size-3" /> {detail.label}
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
