"use client";

import { useEffect } from "react";
import { RefreshCw, Bus } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#0b1120",
          color: "#f8fafc",
          fontFamily: "system-ui, sans-serif",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ maxWidth: "420px", width: "100%", padding: "24px", textAlign: "center" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              backgroundColor: "rgba(249,115,22,0.1)",
              border: "1px solid rgba(249,115,22,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <Bus style={{ width: "32px", height: "32px", color: "#f97316", opacity: 0.6 }} />
          </div>

          <h1 style={{ fontSize: "28px", fontWeight: 900, marginBottom: "12px" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#94a3b8", marginBottom: "8px", lineHeight: "1.6" }}>
            An unexpected error occurred. Our team has been notified.
          </p>

          {process.env.NODE_ENV === "development" && error.message && (
            <pre
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px",
                padding: "12px",
                fontSize: "12px",
                color: "#f87171",
                textAlign: "left",
                overflowX: "auto",
                marginBottom: "16px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {error.message}
              {error.digest && `\n\nDigest: ${error.digest}`}
            </pre>
          )}

          <div
            style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "24px" }}
          >
            <button
              onClick={reset}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                backgroundColor: "#f97316",
                color: "#0b1120",
                border: "none",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              <RefreshCw style={{ width: "16px", height: "16px" }} />
              Try again
            </button>
            <a
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                backgroundColor: "transparent",
                color: "#94a3b8",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px",
                fontWeight: 500,
                fontSize: "14px",
                textDecoration: "none",
              }}
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
