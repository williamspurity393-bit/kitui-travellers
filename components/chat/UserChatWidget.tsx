"use client";

import React from "react";
import { useAction, useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Bot,
  ChevronDown,
  Minimize2,
  Maximize2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PaymentModal } from "@/components/payment/PaymentModal";

// ── Browser fingerprint ────────────────────────────────────────────
// Computed once per browser session and cached in localStorage.
// Used server-side to detect multi-account abuse of the shared Gemini key.
// NOT used when the user has their own personal API key.

const FP_STORAGE_KEY = "kt_device_fp";

async function computeFingerprint(): Promise<string> {
  const signals: string[] = [];

  // Canvas fingerprint — highly device-specific
  try {
    const canvas = document.createElement("canvas");
    const ctx2d = canvas.getContext("2d");
    if (ctx2d) {
      canvas.width = 240;
      canvas.height = 60;
      ctx2d.textBaseline = "top";
      ctx2d.font = "14px Arial";
      ctx2d.fillStyle = "#f97316";
      ctx2d.fillText("Kitui Travellers 🚌 AI", 2, 2);
      ctx2d.fillStyle = "#0ea5e9";
      ctx2d.fillRect(0, 30, 80, 20);
      signals.push(canvas.toDataURL().slice(-64));
    }
  } catch {
    /* privacy mode / sandboxed — skip */
  }

  // Screen
  signals.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);

  // Timezone + language
  signals.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
  signals.push(navigator.language);

  // Hardware
  signals.push(String(navigator.hardwareConcurrency || 0));
  signals.push(String((navigator as any).deviceMemory || 0));

  // Platform family (OS, not full UA to stay semi-stable across browser updates)
  const ua = navigator.userAgent;
  const platform = ua.includes("Win")
    ? "win"
    : ua.includes("Mac")
      ? "mac"
      : ua.includes("Linux")
        ? "linux"
        : ua.includes("Android")
          ? "android"
          : ua.includes("iPhone") || ua.includes("iPad")
            ? "ios"
            : "other";
  signals.push(platform);

  const text = signals.join("|");
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  const hex = Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex.slice(0, 32); // 32-char fingerprint
}

async function getOrCreateFingerprint(): Promise<string | null> {
  try {
    const stored = localStorage.getItem(FP_STORAGE_KEY);
    if (stored && stored.length === 32) return stored;
    const fresh = await computeFingerprint();
    if (fresh) localStorage.setItem(FP_STORAGE_KEY, fresh);
    return fresh || null;
  } catch {
    return null; // privacy mode or localStorage blocked
  }
}

// ── Types ──────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isLoading?: boolean;
  /** Set to "rate_limit" | "network" | "config" | "unknown" for error messages */
  errorType?: string;
}

interface PendingPayment {
  bookingId: Id<"bookings">;
  bookingCode: string;
  amount: number;
}

// ── Welcome message ────────────────────────────────────────────────

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm Beba, your Kitui Travellers assistant 🚌\n\nI can:\n• Book trips and process M-Pesa payment\n• Show available routes and schedules\n• Check your bookings and tickets\n• Review your spending\n• Check notifications\n• Update your profile\n• Answer any travel questions\n\nWhat would you like to do?",
  timestamp: 0,
};

const QUICK_REPLIES = [
  "Book a trip",
  "Available routes",
  "My bookings",
  "My spending",
  "Notifications",
  "My profile",
];

// ══════════════════════════════════════════════════════════════════
// Main widget
// ══════════════════════════════════════════════════════════════════

export function UserChatWidget() {
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.users.getMyProfile, isAuthenticated ? {} : "skip");

  const [isOpen, setIsOpen] = React.useState(false);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [pendingPayment, setPendingPayment] = React.useState<PendingPayment | null>(null);
  const [hasUnread, setHasUnread] = React.useState(false);
  // Device fingerprint — computed once on mount, cached in localStorage
  const [fingerprint, setFingerprint] = React.useState<string | null>(null);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const chatAction = useAction(api.schedulerAgent.userChatAgent);

  // Compute fingerprint on first mount (async, non-blocking)
  React.useEffect(() => {
    getOrCreateFingerprint()
      .then(setFingerprint)
      .catch(() => {});
  }, []);

  // Auto-scroll
  React.useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  // Focus input on open — early return ensures all code paths are consistent
  React.useEffect(() => {
    if (!isOpen || isMinimized) return;
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, [isOpen, isMinimized]);

  // Unread badge when closed
  React.useEffect(() => {
    if (!isOpen && messages.length > 1) {
      const last = messages[messages.length - 1];
      if (last.role === "assistant" && !last.isLoading) setHasUnread(true);
    }
  }, [messages, isOpen]);

  const openChat = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setHasUnread(false);
  };
  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  // ── Send message ───────────────────────────────────────────────

  const sendMessage = React.useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
        timestamp: Date.now(),
      };
      const loading: ChatMessage = {
        id: "loading",
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isLoading: true,
      };
      setMessages((prev) => [...prev, userMsg, loading]);
      setInput("");
      setIsLoading(true);

      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }

      const history = messages
        .filter((m) => m.id !== "welcome" && !m.isLoading)
        .map((m) => ({
          role: m.role === "assistant" ? ("model" as const) : ("user" as const),
          content: m.content,
        }));

      try {
        const response = await chatAction({
          message: text.trim(),
          history,
          fingerprint: fingerprint ?? undefined,
        });
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== "loading"),
          {
            id: crypto.randomUUID(),
            role: "assistant" as const,
            content: response.message,
            timestamp: Date.now(),
            errorType: (response as any).errorType,
          },
        ]);
        if (response.action?.type === "open_payment") {
          setPendingPayment({
            bookingId: response.action.bookingId as Id<"bookings">,
            bookingCode: response.action.bookingCode,
            amount: response.action.amount,
          });
        }
      } catch (err) {
        const isAuth =
          err instanceof Error &&
          (err.message.includes("Not authenticated") || err.message.includes("Unauthenticated"));
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== "loading"),
          {
            id: crypto.randomUUID(),
            role: "assistant" as const,
            content: isAuth
              ? "Please sign in to use the assistant."
              : "❌ Something went wrong. Please try again in a moment.",
            timestamp: Date.now(),
            errorType: isAuth ? "auth" : "unknown",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, chatAction]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
  };

  // ── Payment modal callbacks ────────────────────────────────────

  const handlePaymentSuccess = () => {
    setPendingPayment(null);
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        timestamp: Date.now(),
        content:
          "🎉 Payment confirmed! Your booking is secured.\n\nFind your ticket in My Bookings. After your trip, please leave a review — it helps other travellers! ⭐\n\nHave a safe journey! 🚌",
      },
    ]);
  };

  const handlePaymentClose = () => {
    setPendingPayment(null);
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        timestamp: Date.now(),
        content:
          "Payment screen closed. Your booking is saved but still pending payment.\n\nYou can pay anytime from My Bookings. Need anything else?",
      },
    ]);
  };

  const handleClearChat = () => {
    setMessages([WELCOME]);
    setInput("");
  };

  // Guard: only render for regular users
  if (!isAuthenticated || profile === undefined || profile === null) return null;
  if (profile.accountType !== "user") return null;

  const showQuickReplies = messages.length <= 2 && !isLoading;

  return (
    <>
      {/* Payment modal — z-50, sits above widget */}
      {pendingPayment && (
        <PaymentModal
          bookingId={pendingPayment.bookingId}
          bookingCode={pendingPayment.bookingCode}
          amount={pendingPayment.amount}
          defaultPhone={profile?.phone ?? ""}
          onClose={handlePaymentClose}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/*
        Widget container — z-[35]:
        Below mobile sidebar overlay (z-40) and payment modal (z-50).
        Above regular page content.
        Anchored bottom-right so it never covers sidebar or main content.
      */}
      <div className="fixed bottom-5 right-5 z-[35] flex flex-col items-end gap-3 pointer-events-none">
        {/* Chat panel */}
        {isOpen && (
          <div
            className={cn(
              "pointer-events-auto",
              // Width: nearly full on mobile, fixed on desktop
              "w-[calc(100vw-40px)] sm:w-[380px]",
              "rounded-2xl border border-border bg-card",
              "shadow-2xl shadow-black/30",
              "flex flex-col overflow-hidden",
              "animate-in slide-in-from-bottom-4 fade-in duration-300",
              isMinimized ? "h-[52px]" : "h-[min(540px,calc(100dvh-100px))]"
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-border bg-primary/5 shrink-0">
              <div className="relative w-8 h-8 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
                <Bot className="size-4 text-primary" />
                {isLoading && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground leading-tight">Beba</p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {isLoading ? (
                    <span className="flex items-center gap-1 text-primary/70">
                      <Sparkles className="size-2.5" />
                      Thinking…
                    </span>
                  ) : (
                    "Kitui Travellers AI"
                  )}
                </p>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={handleClearChat}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                  title="Clear chat"
                >
                  <RefreshCw className="size-3" />
                </button>
                <button
                  onClick={() => setIsMinimized((v) => !v)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                  title={isMinimized ? "Expand" : "Minimise"}
                >
                  {isMinimized ? (
                    <Maximize2 className="size-3.5" />
                  ) : (
                    <Minimize2 className="size-3.5" />
                  )}
                </button>
                <button
                  onClick={closeChat}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                  title="Close"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Body */}
            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <ChatBubble key={msg.id} message={msg} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick replies */}
                {showQuickReplies && (
                  <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
                    {QUICK_REPLIES.map((reply) => (
                      <button
                        key={reply}
                        onClick={() => sendMessage(reply)}
                        className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary bg-primary/5 hover:bg-primary/15 transition-colors font-medium whitespace-nowrap"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <form
                  onSubmit={handleSubmit}
                  className="flex items-end gap-2 p-3 border-t border-border bg-background/60 shrink-0"
                >
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message… (Enter to send)"
                    disabled={isLoading}
                    rows={1}
                    className={cn(
                      "flex-1 resize-none rounded-xl px-3 py-2 text-sm",
                      "bg-muted/60 border border-input text-foreground",
                      "placeholder:text-muted-foreground/50",
                      "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
                      "transition-all disabled:opacity-50 overflow-y-hidden"
                    )}
                    style={{ minHeight: "36px", maxHeight: "96px" }}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                      "bg-primary text-primary-foreground",
                      "hover:bg-primary/90 active:scale-95 transition-all",
                      "shadow-sm shadow-primary/30",
                      "disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                    )}
                  >
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-3.5" />
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        {/* FAB */}
        <button
          onClick={isOpen ? closeChat : openChat}
          className={cn(
            "pointer-events-auto",
            "w-14 h-14 rounded-2xl relative flex items-center justify-center",
            "bg-primary text-primary-foreground",
            "shadow-lg shadow-primary/40",
            "hover:bg-primary/90 hover:scale-105 active:scale-95",
            "transition-all duration-200"
          )}
          aria-label={isOpen ? "Close chat" : "Open AI assistant"}
        >
          {isOpen ? <ChevronDown className="size-6" /> : <MessageCircle className="size-6" />}
          {/* Unread badge */}
          {!isOpen && hasUnread && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive border-2 border-card" />
          )}
        </button>
      </div>
    </>
  );
}

// ── Chat bubble ────────────────────────────────────────────────────

/** Render **bold** markdown in chat lines */
function renderLine(line: string) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function ChatBubble({ message }: { message: ChatMessage }) {
  // Loading indicator
  if (message.isLoading) {
    return (
      <div className="flex items-start gap-2">
        <BotAvatar />
        <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="block w-1.5 h-1.5 rounded-full bg-muted-foreground/60"
                style={{ animation: `bounce 0.8s ${i * 0.14}s ease-in-out infinite alternate` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isUser = message.role === "user";
  const isError = !!message.errorType;
  const isRateLimit = message.errorType === "rate_limit";

  // Error messages get their own distinct style (amber for rate-limit, red for others)
  if (!isUser && isError) {
    return (
      <div className="flex items-start gap-2">
        <BotAvatar error />
        <div
          className={cn(
            "max-w-[90%] px-3.5 py-3 text-sm leading-relaxed rounded-2xl rounded-tl-sm space-y-1",
            isRateLimit
              ? "bg-amber-400/10 border border-amber-400/25 text-foreground"
              : "bg-destructive/10 border border-destructive/20 text-foreground"
          )}
        >
          {message.content.split("\n").map((line, i, arr) => (
            <React.Fragment key={i}>
              {renderLine(line)}
              {i < arr.length - 1 && <br />}
            </React.Fragment>
          ))}
          {isRateLimit && (
            <p className="text-[11px] text-amber-500 mt-2 pt-1.5 border-t border-amber-400/20">
              Free tier: 20 requests/day · Upgrade at aistudio.google.com
            </p>
          )}
        </div>
      </div>
    );
  }

  // Normal message
  return (
    <div className={cn("flex items-start gap-2", isUser && "flex-row-reverse")}>
      {!isUser && <BotAvatar />}
      <div
        className={cn(
          "max-w-[82%] px-3.5 py-2.5 text-sm leading-relaxed rounded-2xl",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted text-foreground rounded-tl-sm"
        )}
      >
        {message.content.split("\n").map((line, i, arr) => (
          <React.Fragment key={i}>
            {renderLine(line)}
            {i < arr.length - 1 && <br />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function BotAvatar({ error }: { error?: boolean }) {
  return (
    <div
      className={cn(
        "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
        error
          ? "bg-amber-400/15 border border-amber-400/30"
          : "bg-primary/15 border border-primary/20"
      )}
    >
      <Bot className={cn("size-3", error ? "text-amber-400" : "text-primary")} />
    </div>
  );
}
