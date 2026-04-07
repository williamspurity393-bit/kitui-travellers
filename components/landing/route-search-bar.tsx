"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { ArrowRight, Bus, Clock, Loader2, MapPin, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ── useDebouncedValue ─────────────────────────────────────────
function useDebouncedValue<T>(value: T, delay = 300): [T, boolean] {
  const [debounced, setDebounced] = useState<T>(value);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (value !== debounced) setPending(true);
    const id = setTimeout(() => {
      setDebounced(value);
      setPending(false);
    }, delay);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay]);
  return [debounced, pending];
}

function PortalDropdown({
  anchorRef,
  open,
  children,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  children: React.ReactNode;
}) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Recalculate position on every open + on scroll/resize
  useEffect(() => {
    if (!open || !anchorRef.current) return;

    const update = () => {
      if (anchorRef.current) setRect(anchorRef.current.getBoundingClientRect());
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, anchorRef]);

  if (!open || !rect) return null;

  const style: React.CSSProperties = {
    position: "fixed",
    top: rect.bottom + 6,
    left: rect.left,
    width: Math.max(rect.width, 300),
    zIndex: 9999,
  };

  return ReactDOM.createPortal(
    <div
      style={style}
      className="bg-card border border-border rounded-2xl shadow-2xl shadow-black/30 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200"
    >
      {children}
    </div>,
    document.body
  );
}

// ── Types / helpers ───────────────────────────────────────────
interface Route {
  _id: string;
  name: string;
  origin: string;
  destination: string;
  durationMinutes: number;
  basePrice: number;
  vehicleType: string;
}

const POPULAR = [
  { from: "Kitui", to: "Nairobi" },
  { from: "Kitui", to: "Mombasa" },
  { from: "Kitui", to: "Mwingi" },
  { from: "Kitui", to: "Garissa" },
];

function fmtDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
}

function buildUrl(from: string, to: string) {
  const p = new URLSearchParams();
  if (from.trim()) p.set("from", from.trim());
  if (to.trim()) p.set("to", to.trim());
  return `/routes?${p.toString()}`;
}

// ── RouteResult row ───────────────────────────────────────────
function RouteResult({
  route,
  active,
  onSelect,
}: {
  route: Route;
  active: boolean;
  onSelect: (origin: string, destination: string) => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // prevent input blur before click registers
      onClick={() => onSelect(route.origin, route.destination)}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors group/r",
        active ? "bg-primary/10" : "hover:bg-muted/60"
      )}
    >
      <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
        <Bus className="size-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {route.origin}
          <span className="mx-1.5 text-primary">→</span>
          {route.destination}
        </p>
        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
          {fmtDuration(route.durationMinutes)} · KES {route.basePrice.toLocaleString()} ·{" "}
          {route.vehicleType}
        </p>
      </div>
      <span className="text-[10px] text-primary font-mono opacity-0 group-hover/r:opacity-100 transition-opacity shrink-0 hidden sm:block">
        View &amp; Book
      </span>
      <ArrowRight className="size-3.5 text-muted-foreground group-hover/r:text-primary transition-colors shrink-0" />
    </button>
  );
}

function DropdownSpinner({ pending, query }: { pending: boolean; query: string }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-3.5">
      <Loader2 className="size-3.5 animate-spin text-primary shrink-0" />
      <span className="text-xs text-muted-foreground">
        {pending ? "Waiting…" : `Searching "${query}"…`}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export function RouteSearchBar() {
  const router = useRouter();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [debouncedFrom, fromPending] = useDebouncedValue(from, 300);
  const [debouncedTo, toPending] = useDebouncedValue(to, 300);

  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [fromIdx, setFromIdx] = useState(-1);
  const [toIdx, setToIdx] = useState(-1);

  // Refs for portal positioning
  const fromWrapRef = useRef<HTMLDivElement>(null);
  const toWrapRef = useRef<HTMLDivElement>(null);
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);

  // Convex queries — debounced
  const fromRoutes = useQuery(
    api.routes.getActiveRoutes,
    debouncedFrom.length >= 1 ? { origin: debouncedFrom } : "skip"
  ) as Route[] | undefined;

  const toRoutes = useQuery(
    api.routes.getActiveRoutes,
    debouncedTo.length >= 1 ? { destination: debouncedTo } : "skip"
  ) as Route[] | undefined;

  const fromOptions = React.useMemo<Route[]>(() => {
    if (!fromRoutes) return [];
    const seen = new Set<string>();
    return fromRoutes.filter((r) => {
      if (seen.has(r.origin)) return false;
      seen.add(r.origin);
      return true;
    });
  }, [fromRoutes]);

  const toOptions = React.useMemo<Route[]>(() => {
    if (!toRoutes) return [];
    const seen = new Set<string>();
    return toRoutes.filter((r) => {
      if (seen.has(r.destination)) return false;
      seen.add(r.destination);
      return true;
    });
  }, [toRoutes]);

  // Close both on outside click (listen on document)
  useEffect(() => {
    const h = (e: MouseEvent) => {
      const target = e.target as Node;
      const inFrom = fromWrapRef.current?.contains(target);
      const inTo = toWrapRef.current?.contains(target);
      // Also check portal content (rendered in body)
      const inPortal = (target as Element)?.closest?.("[data-search-portal]");
      if (!inFrom && !inPortal) setFromOpen(false);
      if (!inTo && !inPortal) setToOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Keyboard nav
  const handleFromKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setFromOpen(false);
        return;
      }
      if (!fromOpen || !fromOptions.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFromIdx((i) => Math.min(i + 1, fromOptions.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setFromIdx((i) => Math.max(i - 1, -1));
      }
      if (e.key === "Enter" && fromIdx >= 0) {
        e.preventDefault();
        setFrom(fromOptions[fromIdx].origin);
        setFromOpen(false);
        setFromIdx(-1);
        toRef.current?.focus();
      }
    },
    [fromOpen, fromOptions, fromIdx]
  );

  const handleToKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setToOpen(false);
        return;
      }
      if (!toOpen || !toOptions.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setToIdx((i) => Math.min(i + 1, toOptions.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setToIdx((i) => Math.max(i - 1, -1));
      }
      if (e.key === "Enter" && toIdx >= 0) {
        e.preventDefault();
        router.push(buildUrl(from, toOptions[toIdx].destination));
      }
    },
    [toOpen, toOptions, toIdx, from, router]
  );

  const handleSearch = () => router.push(buildUrl(from, to));

  const handleFromSelect = (origin: string, _dest: string) => {
    setFrom(origin);
    setFromOpen(false);
    setFromIdx(-1);
    if (to.trim()) {
      router.push(buildUrl(origin, to));
    } else {
      toRef.current?.focus();
      setToOpen(true);
    }
  };

  const handleToSelect = (origin: string, destination: string) => {
    setTo(destination);
    setToOpen(false);
    setToIdx(-1);
    router.push(buildUrl(from || origin, destination));
  };

  const fromBusy = from.length >= 1 && (fromPending || fromRoutes === undefined);
  const toBusy = to.length >= 1 && (toPending || toRoutes === undefined);

  return (
    <div className="w-full max-w-3xl mx-auto lg:mx-0">
      {/* Search card */}
      <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-md shadow-xl shadow-black/10 p-1.5 sm:p-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-0">
          {/* FROM */}
          <div ref={fromWrapRef} className="relative flex-1 min-w-0">
            <div className="flex items-center gap-2.5 px-3 sm:px-4 py-2.5 sm:py-3">
              <MapPin className="size-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="block text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-0.5">
                  From
                </label>
                <div className="flex items-center gap-1">
                  <input
                    ref={fromRef}
                    type="text"
                    placeholder="e.g. Kitui"
                    value={from}
                    onChange={(e) => {
                      setFrom(e.target.value);
                      setFromOpen(true);
                      setFromIdx(-1);
                    }}
                    onFocus={() => {
                      if (from.length >= 1) setFromOpen(true);
                    }}
                    onKeyDown={handleFromKey}
                    className="flex-1 min-w-0 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/50 outline-none"
                    autoComplete="off"
                  />
                  {fromPending && from.length >= 1 && (
                    <span className="text-[10px] text-muted-foreground/40 font-mono animate-pulse shrink-0">
                      …
                    </span>
                  )}
                </div>
              </div>
              {from && (
                <button
                  onClick={() => {
                    setFrom("");
                    setFromOpen(false);
                    fromRef.current?.focus();
                  }}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* FROM portal dropdown */}
            <PortalDropdown anchorRef={fromWrapRef} open={fromOpen && from.length >= 1}>
              <div data-search-portal>
                {fromBusy ? (
                  <DropdownSpinner pending={fromPending} query={from} />
                ) : fromOptions.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-muted-foreground">
                    No routes departing from &ldquo;{debouncedFrom}&rdquo;
                  </p>
                ) : (
                  <div className="py-1 max-h-64 overflow-y-auto">
                    <p className="px-4 pt-2 pb-1 text-[9px] font-mono uppercase tracking-widest text-muted-foreground/60">
                      Departing from
                    </p>
                    {fromOptions.map((r, i) => (
                      <RouteResult
                        key={r._id}
                        route={r}
                        active={i === fromIdx}
                        onSelect={handleFromSelect}
                      />
                    ))}
                  </div>
                )}
              </div>
            </PortalDropdown>
          </div>

          {/* Dividers */}
          <div className="hidden sm:block w-px h-10 bg-border mx-1" />
          <div className="sm:hidden h-px bg-border mx-3" />

          {/* Swap */}
          <button
            type="button"
            onClick={() => {
              const t = from;
              setFrom(to);
              setTo(t);
            }}
            className="hidden sm:flex w-8 h-8 mx-1 rounded-xl border border-border bg-muted hover:bg-primary/10 hover:border-primary/30 items-center justify-center transition-all shrink-0"
            title="Swap"
          >
            <ArrowRight className="size-3.5 text-muted-foreground" />
          </button>

          <div className="hidden sm:block w-px h-10 bg-border mx-1" />

          {/* TO */}
          <div ref={toWrapRef} className="relative flex-1 min-w-0">
            <div className="flex items-center gap-2.5 px-3 sm:px-4 py-2.5 sm:py-3">
              <MapPin className="size-4 text-blue-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="block text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-0.5">
                  To
                </label>
                <div className="flex items-center gap-1">
                  <input
                    ref={toRef}
                    type="text"
                    placeholder="e.g. Nairobi"
                    value={to}
                    onChange={(e) => {
                      setTo(e.target.value);
                      setToOpen(true);
                      setToIdx(-1);
                    }}
                    onFocus={() => {
                      if (to.length >= 1) setToOpen(true);
                    }}
                    onKeyDown={(e) => {
                      handleToKey(e);
                      if (e.key === "Enter" && toIdx < 0) handleSearch();
                    }}
                    className="flex-1 min-w-0 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/50 outline-none"
                    autoComplete="off"
                  />
                  {toPending && to.length >= 1 && (
                    <span className="text-[10px] text-muted-foreground/40 font-mono animate-pulse shrink-0">
                      …
                    </span>
                  )}
                </div>
              </div>
              {to && (
                <button
                  onClick={() => {
                    setTo("");
                    setToOpen(false);
                    toRef.current?.focus();
                  }}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* TO portal dropdown */}
            <PortalDropdown anchorRef={toWrapRef} open={toOpen && to.length >= 1}>
              <div data-search-portal>
                {toBusy ? (
                  <DropdownSpinner pending={toPending} query={to} />
                ) : toOptions.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-muted-foreground">
                    No routes arriving at &ldquo;{debouncedTo}&rdquo;
                  </p>
                ) : (
                  <div className="py-1 max-h-64 overflow-y-auto">
                    <p className="px-4 pt-2 pb-1 text-[9px] font-mono uppercase tracking-widest text-muted-foreground/60">
                      Arriving at
                    </p>
                    {toOptions.map((r, i) => (
                      <RouteResult
                        key={r._id}
                        route={r}
                        active={i === toIdx}
                        onSelect={handleToSelect}
                      />
                    ))}
                  </div>
                )}
              </div>
            </PortalDropdown>
          </div>

          {/* Search button */}
          <button
            onClick={handleSearch}
            disabled={fromBusy || toBusy}
            className="flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 m-0.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 shadow-md shadow-primary/25 disabled:opacity-60 shrink-0"
          >
            {fromBusy || toBusy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            <span className="sm:hidden lg:inline">Search</span>
          </button>
        </div>
      </div>

      {/* Popular pills */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
          Popular:
        </span>
        {POPULAR.map((s) => (
          <button
            key={`${s.from}-${s.to}`}
            onClick={() => router.push(buildUrl(s.from, s.to))}
            className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border border-border bg-card hover:border-primary/40 hover:bg-primary/5 hover:text-primary text-muted-foreground transition-all duration-150"
          >
            <Clock className="size-2.5 shrink-0" />
            {s.from} → {s.to}
          </button>
        ))}
      </div>
    </div>
  );
}
