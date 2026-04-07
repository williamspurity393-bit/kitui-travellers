"use client";

import React from "react";
import { CreditCard } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { PaymentModal } from "./PaymentModal";
import { cn } from "@/lib/utils";

interface PayNowButtonProps {
  bookingId: Id<"bookings">;
  bookingCode: string;
  amount: number;
  defaultPhone?: string;
  onPaymentSuccess?: () => void;
  className?: string;
  variant?: "default" | "compact" | "outline";
}

export function PayNowButton({
  bookingId,
  bookingCode,
  amount,
  defaultPhone,
  onPaymentSuccess,
  className,
  variant = "default",
}: PayNowButtonProps) {
  const [open, setOpen] = React.useState(false);

  const handleSuccess = () => {
    onPaymentSuccess?.();
    // Keep modal open so user sees the success state; they close it
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-1.5 font-bold transition-all",
          variant === "default" &&
            "px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm hover:bg-primary/90 shadow-sm shadow-primary/20",
          variant === "compact" &&
            "px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs hover:bg-primary/90",
          variant === "outline" &&
            "px-3 py-1.5 rounded-lg border border-primary text-primary text-xs hover:bg-primary/10",
          className
        )}
      >
        <CreditCard className="size-3.5" />
        Pay via M-Pesa
      </button>

      {open && (
        <PaymentModal
          bookingId={bookingId}
          bookingCode={bookingCode}
          amount={amount}
          defaultPhone={defaultPhone}
          onClose={() => setOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
