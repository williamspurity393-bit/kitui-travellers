import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { twoFactor } from "better-auth/plugins/two-factor";
import { anonymous } from "better-auth/plugins/anonymous";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";

// ── Parse comma-separated SITE_URL ────────────────────────────────────────
const siteUrls = (process.env.SITE_URL ?? "http://localhost:3000")
  .split(",")
  .map((u) => u.trim())
  .filter(Boolean);

const isProduction = Boolean(process.env.CONVEX_CLOUD_URL);

const devUrl = siteUrls.find((u) => u.includes("localhost") || u.includes("127.0.0.1"));
const prodUrl = siteUrls.find((u) => !u.includes("localhost") && !u.includes("127.0.0.1"));

const primarySiteUrl = isProduction ? (prodUrl ?? siteUrls[0]) : (devUrl ?? siteUrls[0]);

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    // REQUIRED: silences "Base URL could not be determined" warning
    baseURL: primarySiteUrl,

    // All allowed origins for CORS + CSRF checks
    trustedOrigins: siteUrls,

    database: authComponent.adapter(ctx),
    appName: "Kitui Travellers",

    account: {
      accountLinking: {
        enabled: true,
        allowDifferentEmails: false,
      },
    },

    // ── Email / Password ─────────────────────────────────────────────────
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 8,

      sendResetPassword: async ({
        user,
        url,
      }: {
        user: { email: string; name: string };
        url: string;
      }) => {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
          console.warn("[auth] RESEND_API_KEY not set — password reset email skipped.");
          return;
        }
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              from: process.env.EMAIL_FROM ?? "Kitui Travellers <noreply@kuittravellers.co.ke>",
              to: user.email,
              subject: "Reset your Kitui Travellers password",
              html: passwordResetEmailHtml(user.name ?? "there", url),
            }),
          });
          if (!res.ok) {
            console.error("[auth] Resend error:", res.status, await res.text());
          }
        } catch (err) {
          console.error("[auth] Failed to send reset email:", err);
        }
      },
    },

    // ── Social Providers ─────────────────────────────────────────────────
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        prompt: "select_account",
      },
    },

    // ── Rate limiting ────────────────────────────────────────────────────
    rateLimit: {
      enabled: true,
      window: 60,
      max: 10,
      storage: "memory",
    },

    // ── Plugins ──────────────────────────────────────────────────────────
    plugins: [
      // crossDomain MUST be first — fixes OAuth state across domains
      crossDomain({ siteUrl: primarySiteUrl }),

      anonymous(),

      // Two-factor authentication (TOTP + backup codes)
      twoFactor({
        issuer: "Kitui Travellers",
        totpOptions: { period: 30 },
      }),

      // Required: wires Better Auth sessions into Convex auth system
      convex({
        authConfig,
        jwt: {
          expirationSeconds: 60 * 60,
          definePayload: ({
            user,
            session,
          }: {
            user: Record<string, unknown>;
            session: Record<string, unknown>;
          }) => ({
            name: user.name,
            email: user.email,
            role: (user as { role?: string }).role ?? "user",
            sessionId: session.id,
            iat: Math.floor(Date.now() / 1000),
          }),
        },
      }),
    ],
  });
};

// ── Password reset email template ─────────────────────────────────────────
function passwordResetEmailHtml(name: string, url: string): string {
  const firstName = String(name).trim().split(/\s+/)[0] ?? "there";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reset your password — Kitui Travellers</title>
<style>
  body{margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5}
  .wrap{max-width:520px;margin:40px auto;background:#111;border:1px solid #222;border-radius:16px;overflow:hidden}
  .header{background:#F97316;padding:24px 32px}
  .header h1{margin:0;color:#fff;font-size:20px;font-weight:900;letter-spacing:-0.5px}
  .header p{margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px}
  .body{padding:32px}
  .btn{display:inline-block;background:#F97316;color:#fff;text-decoration:none;border-radius:12px;padding:14px 32px;font-size:15px;font-weight:700;margin-top:24px}
  .note{margin-top:24px;padding:16px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:10px;font-size:13px;color:#888;line-height:1.6}
  .footer{background:#0a0a0a;padding:18px 32px;text-align:center;font-size:11px;color:#555;border-top:1px solid #1a1a1a}
  h2{font-size:20px;font-weight:800;color:#e5e5e5;margin:0 0 12px}
  p{font-size:14px;color:#aaa;line-height:1.6;margin:8px 0}
  strong{color:#e5e5e5}
</style>
</head>
<body>
<div class="wrap">
  <div class="header"><h1>Kitui Travellers</h1><p>Password Reset Request</p></div>
  <div class="body">
    <h2>Hi ${firstName} 👋</h2>
    <p>We received a request to reset your Kitui Travellers password.</p>
    <a href="${url}" class="btn">Reset My Password</a>
    <div class="note">
      <strong>⏱ This link expires in 1 hour.</strong><br>
      If you didn't request this, you can safely ignore this email.
    </div>
    <p style="margin-top:20px;font-size:12px;color:#555">
      Button not working? Paste this into your browser:<br>
      <span style="color:#F97316;font-family:monospace;word-break:break-all;font-size:11px">${url}</span>
    </p>
  </div>
  <div class="footer">Kitui Travellers Sacco · Kitui Town, Kenya</div>
</div>
</body>
</html>`;
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) return null;
    try {
      return await authComponent.getAuthUser(ctx);
    } catch {
      return null;
    }
  },
});
