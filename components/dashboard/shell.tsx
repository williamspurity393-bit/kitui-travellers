"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Bus,
  LayoutDashboard,
  Map,
  Ticket,
  Bell,
  User,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Users,
  Settings,
  BarChart3,
  Car,
  Calendar,
  Star,
  Loader2,
  Wallet,
  Tag,
  FileText,
  UserCheck,
  ClipboardList,
  Truck,
  AlertTriangle,
} from "lucide-react";
import React, { memo, Suspense } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { useTheme } from "@/components/providers/theme-provider";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

// ── Lazy-load chat widget ─────────────────────────────────────────────────
const UserChatWidget = dynamic(
  () => import("@/components/chat/UserChatWidget").then((m) => ({ default: m.UserChatWidget })),
  { ssr: false, loading: () => null }
);

// ── Nav items ─────────────────────────────────────────────────────────────
type NavItem = { href: string; icon: React.ComponentType<{ className?: string }>; label: string };

// ── UPDATED: Added Settings to USER_NAV ──────────────────────────────────
const USER_NAV: NavItem[] = [
  { href: "/user/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/user/routes", icon: Map, label: "Browse Routes" },
  { href: "/user/bookings", icon: Ticket, label: "My Bookings" },
  { href: "/user/spending", icon: Wallet, label: "My Spending" },
  { href: "/user/profile", icon: User, label: "Profile" },
  { href: "/user/settings", icon: Settings, label: "Settings" }, // ← NEW: 2FA + password
];

const DRIVER_NAV: NavItem[] = [
  { href: "/driver/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/driver/schedule", icon: Calendar, label: "My Schedule" },
  { href: "/driver/passengers", icon: Users, label: "Passengers" },
  { href: "/driver/earnings", icon: BarChart3, label: "Earnings" },
  { href: "/driver/vehicle", icon: Car, label: "My Vehicle" },
  { href: "/driver/routes", icon: Map, label: "Routes" },
  { href: "/driver/profile", icon: User, label: "Profile" },
  { href: "/driver/settings", icon: Settings, label: "Settings" }, // ← NEW: 2FA for drivers too
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/bookings", icon: ClipboardList, label: "Bookings" },
  { href: "/admin/schedules", icon: Calendar, label: "Schedules" },
  { href: "/admin/routes", icon: Map, label: "Routes" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/drivers", icon: UserCheck, label: "Drivers" },
  { href: "/admin/vehicles", icon: Truck, label: "Fleet" },
  { href: "/admin/promos", icon: Tag, label: "Promos" },
  { href: "/admin/reviews", icon: Star, label: "Reviews" },
  { href: "/admin/reports", icon: FileText, label: "Reports" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

// ── Notification badge ────────────────────────────────────────────────────
function NotificationBadge() {
  const { isAuthenticated } = useConvexAuth();
  const count = useQuery(api.notifications.getUnreadCount, !isAuthenticated ? "skip" : {});
  if (!count || count === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-black flex items-center justify-center px-0.5 leading-none">
      {count > 9 ? "9+" : count}
    </span>
  );
}

function TopBarNotificationBell({ accountType }: { accountType?: string }) {
  const { isAuthenticated } = useConvexAuth();
  const count = useQuery(api.notifications.getUnreadCount, !isAuthenticated ? "skip" : {});
  const href =
    accountType === "driver"
      ? "/driver/notifications"
      : accountType === "admin"
        ? "/admin/notifications"
        : "/user/notifications";
  return (
    <Link
      href={href}
      className="relative p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      aria-label={`Notifications${count ? ` — ${count} unread` : ""}`}
    >
      <Bell className="size-5" />
      {!!count && count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[9px] font-black flex items-center justify-center px-0.5 leading-none">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

// ── Ban wall ──────────────────────────────────────────────────────────────
function BanWall({
  banReason,
  onSignOut,
  signingOut,
}: {
  banReason?: string;
  onSignOut: () => void;
  signingOut: boolean;
}) {
  return (
    <div className="flex h-screen items-center justify-center bg-background px-6">
      <div className="max-w-sm w-full space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto">
          <AlertTriangle className="size-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1
            className="text-2xl font-black text-foreground"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Account Suspended
          </h1>
          <p className="text-sm text-muted-foreground">
            You cannot access the Kitui Travellers platform.
          </p>
          {banReason && (
            <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/15 text-left mt-3">
              <p className="text-xs text-muted-foreground mb-0.5">Reason</p>
              <p className="text-sm font-medium text-foreground">{banReason}</p>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          To appeal, email{" "}
          <a href="mailto:support@kuittravellers.co.ke" className="text-primary hover:underline">
            support@kuittravellers.co.ke
          </a>
        </p>
        <button
          onClick={onSignOut}
          disabled={signingOut}
          className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors disabled:opacity-50"
        >
          {signingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
          Sign out
        </button>
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────
interface SidebarProps {
  navItems: NavItem[];
  profile: { accountType: string; fullName?: string | null; phone?: string | null } | null;
  onClose?: () => void;
  onSignOut: () => void;
  signingOut: boolean;
  theme: string;
  onToggleTheme: () => void;
}

const SidebarInner = memo(function SidebarInner({
  navItems,
  profile,
  onClose,
  onSignOut,
  signingOut,
  theme,
  onToggleTheme,
}: SidebarProps) {
  const pathname = usePathname();

  const nameDisplay = profile?.fullName
    ? profile.fullName.trim().split(/\s+/)[0]
    : profile?.phone
      ? profile.phone
      : null;
  const subDisplay =
    profile?.fullName && profile?.phone
      ? profile.phone
      : profile?.accountType
        ? `${profile.accountType} account`
        : "";

  return (
    <aside className="flex flex-col h-full bg-sidebar border-r border-sidebar-border w-full">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border shrink-0">
        <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
          <Image
            src="/icon-192.svg"
            unoptimized
            alt="Kitui Travellers"
            width={28}
            height={28}
            className="rounded-lg shrink-0"
          />
          <div>
            <span
              className="font-black text-sm text-foreground"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Kitui <span className="text-primary">Travellers</span>
            </span>
            <p className="text-[8px] text-muted-foreground -mt-0.5">Online Booking</p>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded text-muted-foreground hover:bg-muted lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Role badge */}
      {profile && (
        <div className="px-4 py-2.5 border-b border-sidebar-border shrink-0">
          <span
            className={cn(
              "text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-lg",
              profile.accountType === "admin" && "bg-destructive/15 text-destructive",
              profile.accountType === "driver" && "bg-blue-500/15 text-blue-400",
              profile.accountType === "user" && "bg-primary/15 text-primary"
            )}
          >
            {profile.accountType}
          </span>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
          const showBadge = href.includes("notifications");
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                isActive
                  ? "bg-primary/15 text-primary font-semibold"
                  : "text-sidebar-foreground hover:bg-muted/50 hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="relative shrink-0">
                <Icon className={cn("size-4", isActive && "text-primary")} />
                {showBadge && <NotificationBadge />}
              </div>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border shrink-0 space-y-1.5">
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>

        <div className="rounded-xl border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              {profile ? (
                <>
                  <p className="text-xs font-semibold truncate text-foreground">
                    {nameDisplay ?? <span className="capitalize">{profile.accountType}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground truncate capitalize">{subDisplay}</p>
                </>
              ) : (
                <div className="space-y-1.5">
                  <div className="h-2.5 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-2 w-32 bg-muted rounded animate-pulse" />
                </div>
              )}
            </div>
            <button
              onClick={onSignOut}
              disabled={signingOut}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 disabled:opacity-50"
              title="Sign out"
              aria-label="Sign out"
            >
              {signingOut ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <LogOut className="size-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
});

SidebarInner.displayName = "SidebarInner";

// ── Dashboard shell ───────────────────────────────────────────────────────
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);
  const { isAuthenticated, isLoading } = useConvexAuth();
  const profile = useQuery(api.users.getMyProfile, isAuthenticated ? {} : "skip");

  const navItems =
    profile?.accountType === "admin"
      ? ADMIN_NAV
      : profile?.accountType === "driver"
        ? DRIVER_NAV
        : USER_NAV;

  const handleSignOut = React.useCallback(async () => {
    setSigningOut(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/";
          },
        },
      });
    } catch {
      toast.error("Sign out failed — please try again");
      setSigningOut(false);
    }
  }, []);

  if (isLoading || profile === undefined) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 text-primary animate-spin" />
      </div>
    );
  }

  if (profile?.isBanned) {
    return (
      <BanWall
        banReason={(profile as { banReason?: string }).banReason}
        onSignOut={handleSignOut}
        signingOut={signingOut}
      />
    );
  }

  const sidebarProps: SidebarProps = {
    navItems,
    profile: profile ?? null,
    onSignOut: handleSignOut,
    signingOut,
    theme,
    onToggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-56 xl:w-60 shrink-0">
        <SidebarInner {...sidebarProps} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 top-0 bottom-0 w-60 z-50">
            <SidebarInner {...sidebarProps} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Desktop top bar */}
        <div className="hidden lg:flex h-14 border-b border-border bg-background/95 backdrop-blur-sm shrink-0">
          <div className="max-w-4xl w-full mx-auto px-5 lg:px-8 flex items-center justify-end gap-2.5">
            {profile?.accountType === "user" && (
              <Link
                href="/user/routes"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
              >
                <Bus className="size-3.5" /> Book a Trip
              </Link>
            )}
            <TopBarNotificationBell accountType={profile?.accountType} />
          </div>
        </div>

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 h-14 px-4 border-b border-border bg-background shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/icon-192.svg"
              unoptimized
              alt="Kitui Travellers"
              width={28}
              height={28}
              className="rounded-lg"
            />
            <span className="font-black text-sm" style={{ fontFamily: "var(--font-syne)" }}>
              Kitui <span className="text-primary">Travellers</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-1.5">
            {profile?.accountType === "user" && (
              <Link
                href="/user/routes"
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
              >
                <Bus className="size-3" /> Book
              </Link>
            )}
            <TopBarNotificationBell accountType={profile?.accountType} />
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" id="main-content">
          {children}
        </main>
      </div>

      {/* AI chat widget — lazy loaded */}
      <Suspense fallback={null}>
        <UserChatWidget />
      </Suspense>
    </div>
  );
}
