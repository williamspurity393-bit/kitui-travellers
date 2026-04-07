# 🚌 TransportMe

Kenya's most reliable online transport booking platform — built with **Next.js 16**, **Convex**, and **Better Auth**.

![Next.js](https://img.shields.io/badge/Next.js-16.2.0-black?logo=next.js)
![Convex](https://img.shields.io/badge/Convex-1.33.1-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)
![Bun](https://img.shields.io/badge/Bun-1.3.6-pink?logo=bun)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Setup Guide](#-environment-setup-guide)
- [Deployment](#-deployment)
- [Role System](#-role-system)
- [Route Protection](#-route-protection)
- [Authentication Flow](#-authentication-flow)
- [Making the First Admin](#-making-the-first-admin)
- [TODOs](#-todos)
- [Common Issues](#-common-issues)

---

## ✨ Features

- ✅ Beautiful landing page with animated hero
- ✅ Login / Signup with Zod validation + password strength meter
- ✅ Onboarding flow (traveller vs driver with full driver form)
- ✅ Role-based dashboard with dynamic sidebar navigation
- ✅ Admin dashboard with revenue chart, recent bookings, pending driver approvals
- ✅ Driver dashboard with trip status, passenger manifest, earnings preview
- ✅ User dashboard with booking cards and quick actions
- ✅ Admin user management with ban/unban/delete
- ✅ Admin routes management with activate/deactivate
- ✅ Admin driver verification with approve/reject
- ✅ Admin bookings table with filters and status
- ✅ Admin system settings with tabs
- ✅ User bookings page with QR/PDF/cancel actions
- ✅ Public routes browsing with multi-filter search
- ✅ Dark/Light mode with persistence
- ✅ Rate limiting on auth endpoints (10 req/60s)
- ✅ Full Convex schema (routes, schedules, bookings, promos, reviews, notifications, audit logs)
- ✅ Booking code generation (TM-XXXXX format)
- ✅ Promo code validation in booking flow
- ✅ Audit logging for all admin actions
- ✅ Fully responsive for mobile/tablet/desktop
- ✅ M-Pesa STK Push payments (Safaricom Daraja)
- ✅ Email notifications via Resend
- ✅ AI-powered features via Google Gemini
- ✅ Multi-language support via Google Translate

---

## 🧰 Tech Stack

| Layer         | Technology                                      |
| ------------- | ----------------------------------------------- |
| Frontend      | Next.js 16 (App Router) · React 19 · TypeScript |
| Database      | Convex (real-time)                              |
| Auth          | Better Auth + Convex component                  |
| Payments      | Safaricom Daraja (M-Pesa STK Push)              |
| Email         | Resend                                          |
| AI            | Google Gemini                                   |
| Translation   | Google Translate (translate.gt)                 |
| Styling       | Tailwind CSS v4 · JetBrains Mono + Syne fonts   |
| Forms         | React Hook Form · Zod                           |
| Icons         | Lucide React · Phosphor Icons                   |
| Rate Limiting | `@convex-dev/rate-limiter`                      |
| Runtime       | Bun                                             |
| Deployment    | Vercel (frontend) + Convex Cloud (backend)      |

---

## 📁 Project Structure

```
transport-me/
├── app/
│   ├── (auth)/               # Auth pages – no sidebar
│   │   ├── login/            # Login form
│   │   ├── signup/           # Signup with password strength
│   │   └── onboarding/       # Account type selection + profile setup
│   ├── (dashboard)/          # Protected dashboard pages
│   │   ├── layout.tsx        # Shared sidebar layout (role-aware nav)
│   │   ├── user/             # Traveller pages
│   │   │   ├── page.tsx      # User dashboard
│   │   │   ├── bookings/     # Booking history
│   │   │   └── profile/      # User profile
│   │   ├── driver/           # Driver pages
│   │   │   └── page.tsx      # Driver dashboard
│   │   └── admin/            # Admin pages
│   │       ├── page.tsx      # Admin overview
│   │       ├── users/        # User management
│   │       ├── routes/       # Route management
│   │       ├── bookings/     # All bookings
│   │       ├── drivers/      # Driver verification
│   │       └── settings/     # System settings
│   ├── api/
│   │   └── mpesa/            # M-Pesa callback handler
│   ├── routes/               # Public route browsing
│   └── page.tsx              # Landing page
├── convex/
│   ├── convex.config.ts      # Convex app config (Better Auth + Rate Limiter)
│   ├── auth.ts               # Better Auth setup + admin plugin + rate limiting
│   ├── auth.config.ts        # Convex auth config
│   ├── schema.ts             # Full database schema
│   ├── users.ts              # User profile CRUD
│   ├── bookings.ts           # Booking CRUD
│   ├── routes.ts             # Route CRUD
│   └── tsconfig.json         # Convex TypeScript config
├── lib/
│   ├── auth-client.ts        # Better Auth client (with admin plugin)
│   ├── auth-server.ts        # Server-side auth utilities
│   ├── validations.ts        # All Zod schemas
│   └── utils.ts              # cn() utility
├── components/               # Shared React components
├── middleware.ts             # Route protection
├── .env.example              # Template for environment variables
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have these installed before cloning:

- [Bun](https://bun.sh) `>= 1.3.6`

  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```

- [Node.js](https://nodejs.org) `>= 18`
- [Git](https://git-scm.com)

---

### 1. Clone the Repository

```bash
git clone https://github.com/levos-snr/transport-me.git
cd transport-me
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Install Any Missing Dependencies

```bash
bun add zod react-hook-form @hookform/resolvers @convex-dev/rate-limiter
```

### 4. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in each value. Follow the full guide in the [Environment Setup Guide](#-environment-setup-guide) section below.

### 5. Start the Convex Dev Server

Open a **separate terminal** and run:

```bash
npx convex dev
```

This prompts you to log in and create or select a Convex project. It automatically writes `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_CONVEX_URL`, and `NEXT_PUBLIC_CONVEX_SITE_URL` into your `.env.local`.

### 6. Start the App

```bash
bun run dev
```

This runs both Next.js and Convex concurrently. Open [http://localhost:3000](http://localhost:3000).

---

## 🔧 Environment Setup Guide

### Full `.env.example`

```env
# ===========================================
# CONVEX CONFIGURATION
# ===========================================
# Run `npx convex dev` to get these automatically after creating a project at:
# https://dashboard.convex.dev
CONVEX_DEPLOYMENT=dev:your-project-name # team: your-team, project: your-project
NEXT_PUBLIC_CONVEX_URL=https://your-project-name.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://your-project-name.convex.site

# ===========================================
# BETTER AUTH
# ===========================================
# Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=your-better-auth-secret

# ===========================================
# SITE URLs
# ===========================================
# Comma-separated list of allowed origins (local + production)
SITE_URL=http://localhost:3000,https://your-app.vercel.app
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# ===========================================
# MPESA (Safaricom Daraja API)
# ===========================================
# Register at: https://developer.safaricom.co.ke
# Create an app → get Consumer Key & Secret from the app dashboard
MPESA_CONSUMER_KEY=your-mpesa-consumer-key
MPESA_CONSUMER_SECRET=your-mpesa-consumer-secret
# For sandbox testing use shortcode: 174379
MPESA_SHORTCODE=174379
# Sandbox passkey (standard for all sandbox accounts):
# bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_PASSKEY=your-mpesa-passkey
# Use "sandbox" for testing, "production" for live
MPESA_ENVIRONMENT=sandbox
# Must be a publicly accessible HTTPS URL (use ngrok for local dev)
MPESA_CALLBACK_URL=https://your-app.vercel.app/api/mpesa/callback

# ===========================================
# RESEND (Email)
# ===========================================
# Sign up at: https://resend.com → API Keys → Create API Key
RESEND_API_KEY=re_your_resend_api_key
# Use your verified domain or onboarding@resend.dev for testing
EMAIL_FROM=TransportMe <onboarding@resend.dev>

# ===========================================
# GOOGLE GEMINI AI
# ===========================================
# Get your key at: https://aistudio.google.com/apikey
GEMINI_API_KEY=your-gemini-api-key

# ===========================================
# GOOGLE OAUTH
# ===========================================
# Go to: https://console.cloud.google.com
# APIs & Services → Credentials → Create OAuth 2.0 Client ID
# Add http://localhost:3000 and your production URL as authorized origins
# Add http://localhost:3000/api/auth/callback/google as redirect URI
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# ===========================================
# GOOGLE TRANSLATE (translate.gt)
# ===========================================
# Sign up at: https://translate.gt
# Dashboard → API Keys → Create Key & Project
GT_API_KEY=gtx-api-your-key-here
GT_PROJECT_ID=prj_your-project-id
```

---

### 1. 🟠 Convex

#### Local Development

Running `npx convex dev` handles everything automatically:

1. Prompts you to log in at [dashboard.convex.dev](https://dashboard.convex.dev)
2. Creates a new project or lets you select an existing one
3. Auto-writes into your `.env.local`:
   ```env
   CONVEX_DEPLOYMENT=dev:your-project-name
   NEXT_PUBLIC_CONVEX_URL=https://your-project-name.convex.cloud
   NEXT_PUBLIC_CONVEX_SITE_URL=https://your-project-name.convex.site
   ```

#### Add Convex Environment Variables

Convex backend functions run in Convex's own cloud — they **cannot** read Vercel env vars. You must add backend secrets separately:

1. Go to [dashboard.convex.dev](https://dashboard.convex.dev)
2. Select your project → **Settings → Environment Variables**
3. Add every variable that has ✅ under **Convex Dashboard** in the [Where Each Variable Lives](#-where-each-variable-lives) table

---

### 2. 🔑 Better Auth Secret

Generate a cryptographically secure random secret:

```bash
# macOS / Linux
openssl rand -base64 32

# Node.js (any platform)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# PowerShell (Windows)
[Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Max 256) }))
```

```env
BETTER_AUTH_SECRET=<paste output here>
```

> ⚠️ Use the **exact same value** in both Vercel and the Convex dashboard.

---

### 3. 🔵 Google OAuth (Sign in with Google)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Go to **APIs & Services → OAuth Consent Screen**
   - User type: **External**
   - Fill in: App name (`TransportMe`), Support email, Developer email
   - Add scopes: `openid`, `email`, `profile`
   - Under **Test Users**, add your own email (required while in development)
   - Click **Save and Continue**
4. Go to **APIs & Services → Credentials**
5. Click **"+ Create Credentials" → OAuth 2.0 Client ID**
6. Application type: **Web application**
7. Under **Authorized JavaScript Origins** add:
   ```
   http://localhost:3000
   https://your-app.vercel.app
   ```
8. Under **Authorized Redirect URIs** add:
   ```
   http://localhost:3000/api/auth/callback/google
   https://your-app.vercel.app/api/auth/callback/google
   ```
9. Click **Create** — copy the **Client ID** and **Client Secret**

```env
GOOGLE_CLIENT_ID=382645675199-xxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx
```

> **Going to production?** Return to the OAuth Consent Screen → click **"Publish App"**. Without this, only manually added test users can sign in.

---

### 4. 💚 M-Pesa (Safaricom Daraja)

#### Sandbox / Development

1. Register at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Go to **My Apps → Create New App**
3. Check **Lipa na M-Pesa Sandbox** and give the app a name
4. Copy **Consumer Key** and **Consumer Secret** from the app page

Use these standard sandbox credentials (work for every sandbox account):

```env
MPESA_CONSUMER_KEY=<from Daraja app>
MPESA_CONSUMER_SECRET=<from Daraja app>
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_ENVIRONMENT=sandbox
```

For local development, M-Pesa needs a public HTTPS callback URL. Use [ngrok](https://ngrok.com):

```bash
ngrok http 3000
# Copy the https:// URL ngrok gives you
MPESA_CALLBACK_URL=https://xxxx.ngrok.io/api/mpesa/callback
```

#### Production

1. Go to the Daraja portal → apply for **Go Live**
2. Once Safaricom approves, you'll receive a production shortcode and passkey
3. Update:
   ```env
   MPESA_ENVIRONMENT=production
   MPESA_SHORTCODE=your-production-shortcode
   MPESA_PASSKEY=your-production-passkey
   MPESA_CALLBACK_URL=https://your-app.vercel.app/api/mpesa/callback
   ```

---

### 5. 📧 Resend (Email)

1. Sign up at [resend.com](https://resend.com)
2. Go to **API Keys → Create API Key**, name it, and copy it

**Development** — send from Resend's test address, no domain setup needed:

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=TransportMe <onboarding@resend.dev>
```

**Production** — verify your own domain for custom sender address:

1. Go to **Domains → Add Domain** in the Resend dashboard
2. Add the DNS TXT/MX records shown to your domain registrar
3. Once verified (usually a few minutes), update:
   ```env
   EMAIL_FROM=TransportMe <noreply@yourdomain.com>
   ```

---

### 6. 🤖 Google Gemini AI

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Click **"Create API Key"** and select your Google Cloud project
3. Copy the key:

```env
GEMINI_API_KEY=AIzaSy-xxxxxxxxxxxx
```

---

### 7. 🌍 Google Translate (translate.gt)

1. Sign up at [translate.gt](https://translate.gt)
2. Go to **Dashboard → API Keys → Create Key**
3. Go to **Projects → New Project** and copy the Project ID
4. Copy both values:

```env
GT_API_KEY=gtx-api-xxxxxxxxxxxx
GT_PROJECT_ID=prj_xxxxxxxxxxxx
```

---

## 📋 Where Each Variable Lives

> Add variables in **every** column that shows ✅. Missing even one will cause runtime errors in that environment.

| Variable                      | Vercel | Convex Dashboard | Notes                             |
| ----------------------------- | :----: | :--------------: | --------------------------------- |
| `CONVEX_DEPLOYMENT`           |   ✅   |        —         | Use `prod:` prefix for production |
| `NEXT_PUBLIC_CONVEX_URL`      |   ✅   |        —         | Baked into frontend at build time |
| `NEXT_PUBLIC_CONVEX_SITE_URL` |   ✅   |        —         | Baked into frontend at build time |
| `NEXT_PUBLIC_SITE_URL`        |   ✅   |        —         | Baked into frontend at build time |
| `BETTER_AUTH_SECRET`          |   ✅   |        ✅        | Must be **identical** in both     |
| `SITE_URL`                    |   ✅   |        ✅        | Comma-separated allowed origins   |
| `MPESA_CONSUMER_KEY`          |   ✅   |        ✅        |                                   |
| `MPESA_CONSUMER_SECRET`       |   ✅   |        ✅        |                                   |
| `MPESA_SHORTCODE`             |   ✅   |        ✅        |                                   |
| `MPESA_PASSKEY`               |   ✅   |        ✅        |                                   |
| `MPESA_ENVIRONMENT`           |   ✅   |        ✅        | `sandbox` or `production`         |
| `MPESA_CALLBACK_URL`          |   ✅   |        ✅        | Must point to your Vercel domain  |
| `RESEND_API_KEY`              |   ✅   |        ✅        |                                   |
| `EMAIL_FROM`                  |   ✅   |        ✅        |                                   |
| `GEMINI_API_KEY`              |   ✅   |        ✅        |                                   |
| `GOOGLE_CLIENT_ID`            |   ✅   |        ✅        |                                   |
| `GOOGLE_CLIENT_SECRET`        |   ✅   |        ✅        |                                   |
| `GT_API_KEY`                  |   ✅   |        ✅        |                                   |
| `GT_PROJECT_ID`               |   ✅   |        ✅        |                                   |

> `NEXT_PUBLIC_*` variables are embedded into the frontend bundle at build time — they only need to be in Vercel, not in Convex.

---

## 🚢 Deployment

### Step 1 — Deploy Convex Backend First

Before deploying to Vercel, push your Convex schema and functions to production:

```bash
npx convex deploy
```

Output will look like:

```
Deploying to production: prod:your-project-name
✓ Pushed 12 functions to production
```

Copy the production deployment name (`prod:your-project-name`) — you'll need it for Vercel.

Then go to the **Convex dashboard → Settings → Environment Variables** and add all backend secrets from the table above.

---

### Step 2 — Deploy to Vercel

#### Option A: Via Vercel Dashboard (Recommended for First Deploy)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **"Add New Project"**
3. Click **"Import"** next to your `transport-me` repository
4. Framework preset will be auto-detected as **Next.js**
5. Expand **"Environment Variables"** before clicking Deploy and add:

| Key                           | Value                                               |
| ----------------------------- | --------------------------------------------------- |
| `CONVEX_DEPLOYMENT`           | `prod:your-project-name`                            |
| `NEXT_PUBLIC_CONVEX_URL`      | `https://your-project-name.convex.cloud`            |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | `https://your-project-name.convex.site`             |
| `NEXT_PUBLIC_SITE_URL`        | `https://your-app.vercel.app`                       |
| `SITE_URL`                    | `http://localhost:3000,https://your-app.vercel.app` |
| `BETTER_AUTH_SECRET`          | Your generated secret                               |
| `MPESA_CALLBACK_URL`          | `https://your-app.vercel.app/api/mpesa/callback`    |
| _(all other variables)_       | Same as your `.env.local`                           |

6. Click **Deploy** 🚀

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
bun add -g vercel

# Login
vercel login

# Link to your project (first time only)
vercel link

# Deploy to production
vercel --prod
```

#### Subsequent Deployments

Every push to `main` auto-deploys via Vercel's GitHub integration. To manually trigger a production deploy:

```bash
vercel --prod
```

---

### Step 3 — Post-Deployment Checklist

After your first successful deployment:

- [ ] Visit your Vercel URL and confirm the app loads correctly
- [ ] Test Google OAuth sign-in end-to-end
- [ ] Confirm Google Cloud OAuth Consent Screen is **Published** (not in test mode)
- [ ] Verify Google Cloud redirect URIs include your Vercel domain
- [ ] Test M-Pesa STK Push with a sandbox phone number (`254708374149`)
- [ ] Confirm emails arrive via the Resend dashboard logs
- [ ] Update `SITE_URL` in the Convex dashboard to include your final Vercel URL
- [ ] Check the Convex dashboard logs for any function errors

---

## 👥 Role System

| Role         | Account Type | What They Can Do                                                |
| ------------ | ------------ | --------------------------------------------------------------- |
| 🙍 Traveller | `user`       | Browse routes, book tickets, manage own bookings, write reviews |
| 🚌 Driver    | `driver`     | View assigned schedules, manage passengers, view earnings       |
| 🛡️ Admin     | `admin`      | Full system access – users, routes, vehicles, reports, settings |

Role is stored in two places:

1. `userProfiles.accountType` in Convex — primary source of truth for app logic
2. Better Auth `user.role` — synced when admin is set; included in the JWT payload

---

## 🔐 Route Protection

| Pattern                                        | Access                                                     |
| ---------------------------------------------- | ---------------------------------------------------------- |
| `/` `/routes` `/about`                         | Public                                                     |
| `/auth/login` `/auth/signup`                   | Public (redirects if already logged in)                    |
| `/user/*` `/driver/*` `/admin/*` `/onboarding` | Authenticated only                                         |
| Role-specific pages                            | Checked server-side via `useQuery(api.users.getMyProfile)` |

---

## 🔑 Authentication Flow

```
Sign Up → Onboarding (choose role) → Dashboard (redirects by role)
                                    ├─ /user/dashboard   (traveller)
                                    ├─ /driver/dashboard (driver – pending verification)
                                    └─ /admin/dashboard  (admin)
```

---

## 🛡️ Making the First Admin

There's no admin user by default. To bootstrap your first admin account:

1. Sign up normally through the app
2. Go to [dashboard.convex.dev](https://dashboard.convex.dev) → your project → **Data**
3. Open the `userProfiles` table
4. Find your user record and click to edit it
5. Set `accountType` to `"admin"` and save
6. Also open the `users` table (Better Auth's table) and set `role` to `"admin"` for the same user

From that point forward you can promote other users to admin directly from the Admin dashboard UI in the app.

---

## 🛠️ Common Issues

### `Cannot find module '@convex-dev/rate-limiter/convex.config.js'`

Your `convex/tsconfig.json` must use `"moduleResolution": "Bundler"` with the correct `exclude`. Replace the entire file with:

```json
{
  "compilerOptions": {
    "allowJs": true,
    "strict": true,
    "skipLibCheck": true,
    "jsx": "react",
    "target": "ESNext",
    "lib": ["ES2021", "dom", "ESNext.Array", "DOM.Iterable"],
    "forceConsistentCasingInFileNames": true,
    "allowSyntheticDefaultImports": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["./**/*"],
  "exclude": ["./_generated"]
}
```

Also ensure `@convex-dev/rate-limiter` is in your `package.json`:

```bash
bun add @convex-dev/rate-limiter
```

### Google OAuth redirect mismatch error

Make sure both of these are added in Google Cloud → your OAuth client:

- **Authorized JavaScript Origins:** `http://localhost:3000` and `https://your-app.vercel.app`
- **Authorized Redirect URIs:** `http://localhost:3000/api/auth/callback/google` and `https://your-app.vercel.app/api/auth/callback/google`

### M-Pesa callback not firing locally

M-Pesa requires a public HTTPS URL. Use [ngrok](https://ngrok.com) to tunnel your local server:

```bash
ngrok http 3000
# Update MPESA_CALLBACK_URL to the https:// ngrok URL
```

### Vercel build failing with TypeScript errors

Run this locally first to catch type errors before pushing:

```bash
bun run check-types
```

### Convex functions not reading environment variables

Convex functions run in Convex's cloud, not on Vercel. Any variable used inside a `convex/` file must be added in the **Convex dashboard → Settings → Environment Variables** — not just in Vercel.

### Only test users can sign in with Google

Your Google OAuth app is still in test mode. Go to **Google Cloud Console → APIs & Services → OAuth Consent Screen** and click **"Publish App"**.

---

## 📜 Scripts

| Command                | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `bun run dev`          | Start Next.js + Convex dev watchers concurrently |
| `bun run dev:next`     | Start Next.js dev server only                    |
| `bun run dev:convex`   | Start Convex dev watcher only                    |
| `bun run build`        | Production build                                 |
| `bun run start`        | Start production server                          |
| `bun run check-types`  | TypeScript type check (no emit)                  |
| `bun run lint`         | ESLint                                           |
| `bun run lint:fix`     | ESLint with auto-fix                             |
| `bun run format`       | Prettier — format all files                      |
| `bun run format:check` | Prettier — check formatting without writing      |

---

## 📌 TODOs

- [ ] **Payment Integration** – M-Pesa Daraja STK Push (`/booking/[id]/pay`)
- [ ] **Stripe Card Payments** – For international cards
- [ ] **PDF Ticket Generation** – `react-pdf` or `pdfmake`
- [ ] **QR Code Generation** – `qrcode.react` for booking verification
- [ ] **Email Notifications** – Resend component for Convex
- [ ] **SMS Notifications** – Africa's Talking or Twilio for Kenyan numbers
- [ ] **Real-time Seat Map** – Interactive seat selection UI
- [ ] **5-step Booking Flow** – Schedule → Seats → Passengers → Payment → Confirmation
- [ ] **Driver Earnings** – Real Convex queries for earnings data
- [ ] **Admin Reports** – Revenue charts with real data (recharts)
- [ ] **Promo Code Management** – Admin CRUD for promo codes
- [ ] **Trip Reviews** – Star rating + comment form after completed trips
- [ ] **Push Notifications** – Web push for trip reminders
- [ ] **Swahili i18n** – Add `next-intl` with `en`/`sw` locales
- [ ] **Audit Log Viewer** – Admin page to browse `auditLogs` table
- [ ] **Backup & Recovery** – Convex data export tooling
- [ ] **Vehicle Maintenance Tracker** – Maintenance schedule reminders for admins

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.
