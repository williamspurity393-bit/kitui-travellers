"use client";

import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "@/components/providers/theme-provider";

export function Toaster() {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={theme === "dark" ? "dark" : "light"}
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "font-mono text-sm rounded-xl border border-border bg-card text-foreground shadow-lg",
          title: "font-semibold",
          description: "text-muted-foreground",
          success: "!border-emerald-500/30 !bg-emerald-500/10 !text-emerald-400",
          error: "!border-destructive/30 !bg-destructive/10 !text-destructive",
          warning: "!border-amber-500/30 !bg-amber-500/10 !text-amber-400",
          info: "!border-primary/30 !bg-primary/10 !text-primary",
          actionButton: "!bg-primary !text-primary-foreground !font-semibold !rounded-lg",
          cancelButton: "!bg-muted !text-muted-foreground !font-semibold !rounded-lg",
        },
      }}
      richColors
      closeButton
    />
  );
}
