# 🚌 Transport Me

A modern transport booking and management platform built with Next.js, Convex, and M-Pesa payments — designed for Kenyan transport routes.

![Next.js](https://img.shields.io/badge/Next.js-16.2.0-black?logo=next.js)
![Convex](https://img.shields.io/badge/Convex-1.33.1-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)
![Bun](https://img.shields.io/badge/Bun-1.3.6-pink?logo=bun)

---

## ✨ Features

- 🔐 Authentication via Google OAuth (Better Auth + Convex)
- 💳 M-Pesa STK Push payments (Safaricom Daraja API)
- 📧 Email notifications via Resend
- 🤖 AI-powered features via Google Gemini
- 🌍 Multi-language support via Google Translate
- ⚡ Real-time data with Convex
- 🛡️ Rate limiting with `@convex-dev/rate-limiter`

---

## 🧰 Tech Stack

| Layer       | Technology                                         |
| ----------- | -------------------------------------------------- |
| Frontend    | Next.js 16, React 19, Tailwind CSS v4              |
| Backend     | Convex (real-time database + serverless functions) |
| Auth        | Better Auth + Convex                               |
| Payments    | Safaricom Daraja (M-Pesa)                          |
| Email       | Resend                                             |
| AI          | Google Gemini                                      |
| Translation | Google Translate (translate.gt)                    |
| Runtime     | Bun                                                |
| Deployment  | Vercel (frontend) + Convex Cloud (backend)         |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Bun](https://bun.sh) `>= 1.3.6`
- [Node.js](https://nodejs.org) `>= 18`
- [Git](https://git-scm.com)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/transport-me.git
cd transport-me
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Follow the [Environment Setup Guide](#-environment-setup-guide) below to fill in all values.

### 4. Start Development

```bash
bun run dev
```

This starts both the Next.js dev server and Convex dev watcher concurrently.

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔧 Environment Setup Guide

### `.env.example`

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
# For sandbox testing use the standard sandbox passkey below:
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
EMAIL_FROM=Your App Name <onboarding@resend.dev>

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
# GOOGLE TRANSLATE API
# ===========================================
# Sign up at: https://translate.gt
# Dashboard → API Keys → Create Key & Project
GT_API_KEY=gtx-api-your-key-here
GT_PROJECT_ID=prj_your-project-id
```

---

### 1. 🟠 Convex Setup

#### Get Your Convex Credentials (Local Dev)

1. Create an account at [dashboard.convex.dev](https://dashboard.convex.dev)
2. Click **"New Project"** and name it
3. In your terminal run:
   ```bash
   npx convex dev
   ```
4. Log in when prompted and select your project
5. Convex automatically writes these to your `.env.local`:
   ```env
   CONVEX_DEPLOYMENT=dev:your-project-name
   NEXT_PUBLIC_CONVEX_URL=https://your-project-name.convex.cloud
   NEXT_PUBLIC_CONVEX_SITE_URL=https://your-project-name.convex.site
   ```

#### Deploy Convex to Production

```bash
npx convex deploy
```

This pushes your schema and functions to Convex's production cloud. You'll get a `prod:your-project-name` deployment URL to use in Vercel.

#### Set Convex Environment Variables

1. Go to your project on [dashboard.convex.dev](https://dashboard.convex.dev)
2. Navigate to **Settings → Environment Variables**
3. Add all backend variables (see the [Where Each Variable Lives](#-where-each-variable-lives) table)

> **Why Convex needs its own env vars?**
> Convex backend functions run in Convex's cloud — completely separate from Vercel. They cannot read Vercel env vars, so any secret used inside a Convex function must be added to the Convex dashboard separately.

---

### 2. 🔑 Better Auth Secret

Generate a cryptographically secure secret:

```bash
# macOS / Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Max 256) }))

# Node.js (any platform)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

```env
BETTER_AUTH_SECRET=<paste the generated value here>
```

Use the **exact same secret** in both Vercel and Convex dashboard environment variables.

---

### 3. 🔵 Google OAuth Setup

#### Create OAuth 2.0 Credentials

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or select an existing one)
3. Go to **APIs & Services → OAuth Consent Screen**
   - Choose **External**
   - Fill in: App name, Support email, Developer email
   - Add scopes: `openid`, `email`, `profile`
   - Add your own email as a **Test User** (required while in development)
4. Go to **APIs & Services → Credentials**
5. Click **"+ Create Credentials" → OAuth 2.0 Client ID**
6. Application type: **Web application**
7. Add **Authorized JavaScript Origins:**
   ```
   http://localhost:3000
   https://your-app.vercel.app
   ```
8. Add **Authorized Redirect URIs:**
   ```
   http://localhost:3000/api/auth/callback/google
   https://your-app.vercel.app/api/auth/callback/google
   ```
9. Click **Create** — copy the **Client ID** and **Client Secret**

```env
GOOGLE_CLIENT_ID=382645675199-xxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx
```

> **Going to production?** Return to the OAuth Consent Screen and click **"Publish App"** — otherwise only users you've manually added as test users can sign in.

---

### 4. 💚 M-Pesa (Safaricom Daraja)

#### Sandbox / Development

1. Register at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Go to **My Apps → Create New App**
3. Select the **Lipa na M-Pesa Sandbox** API
4. Copy **Consumer Key** and **Consumer Secret** from the app page

Use these standard sandbox values (they work for all sandbox accounts):

```env
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_ENVIRONMENT=sandbox
```

For the callback URL in local development, use [ngrok](https://ngrok.com) to expose your localhost:

```bash
ngrok http 3000
# Copy the https:// URL ngrok gives you
MPESA_CALLBACK_URL=https://xxxx.ngrok.io/api/mpesa/callback
```

#### Production

1. Apply for a **Go Live** account on the Daraja portal
2. Once approved by Safaricom, you'll receive a production shortcode and passkey
3. Update your env:
   ```env
   MPESA_ENVIRONMENT=production
   MPESA_SHORTCODE=your-production-shortcode
   MPESA_PASSKEY=your-production-passkey
   MPESA_CALLBACK_URL=https://your-app.vercel.app/api/mpesa/callback
   ```

---

### 5. 📧 Resend (Email)

1. Sign up at [resend.com](https://resend.com)
2. Go to **API Keys → Create API Key** and copy it

For **development**, you can send from `onboarding@resend.dev` without verifying a domain:

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=Transport Me <onboarding@resend.dev>
```

For **production**, verify your domain:

1. Go to **Domains → Add Domain** in the Resend dashboard
2. Add the DNS records shown to your domain registrar
3. Once verified, update:
   ```env
   EMAIL_FROM=Transport Me <noreply@yourdomain.com>
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
2. Go to your **Dashboard → API Keys → Create Key**
3. Create a project and copy the Project ID
4. Copy both values:
   ```env
   GT_API_KEY=gtx-api-xxxxxxxxxxxx
   GT_PROJECT_ID=prj_xxxxxxxxxxxx
   ```

---

## 🚢 Deployment

### Vercel (Frontend + API Routes)

#### First Deployment

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **"Add New Project"**
3. Import your GitHub repository
4. Framework preset: **Next.js** (auto-detected)
5. Add all environment variables (see below)
6. Click **Deploy**

#### Adding Environment Variables in Vercel

Go to your Vercel project → **Settings → Environment Variables** and add:

| Variable                      | Value                                               |
| ----------------------------- | --------------------------------------------------- |
| `CONVEX_DEPLOYMENT`           | `prod:your-project-name` (from `npx convex deploy`) |
| `NEXT_PUBLIC_CONVEX_URL`      | `https://your-project-name.convex.cloud`            |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | `https://your-project-name.convex.site`             |
| `NEXT_PUBLIC_SITE_URL`        | `https://your-app.vercel.app`                       |
| `SITE_URL`                    | `http://localhost:3000,https://your-app.vercel.app` |
| `BETTER_AUTH_SECRET`          | Your generated secret                               |
| `MPESA_CALLBACK_URL`          | `https://your-app.vercel.app/api/mpesa/callback`    |
| All other variables           | Same values as your `.env.local`                    |

#### Subsequent Deployments

Every push to `main` auto-deploys. To trigger a manual production deploy:

```bash
vercel --prod
```

---

### Convex (Backend)

#### Deploy to Production

```bash
npx convex deploy
```

#### Add Environment Variables in Convex Dashboard

1. Go to [dashboard.convex.dev](https://dashboard.convex.dev)
2. Select your project → **Settings → Environment Variables**
3. Add all backend secrets (see table below)

---

## 📋 Where Each Variable Lives

> Variables must be added in **every** column that has ✅.

| Variable                      | Vercel | Convex Dashboard | Notes                             |
| ----------------------------- | :----: | :--------------: | --------------------------------- |
| `CONVEX_DEPLOYMENT`           |   ✅   |        —         | Use `prod:` prefix for production |
| `NEXT_PUBLIC_CONVEX_URL`      |   ✅   |        —         | Baked into frontend bundle        |
| `NEXT_PUBLIC_CONVEX_SITE_URL` |   ✅   |        —         | Baked into frontend bundle        |
| `NEXT_PUBLIC_SITE_URL`        |   ✅   |        —         | Baked into frontend bundle        |
| `BETTER_AUTH_SECRET`          |   ✅   |        ✅        | Must be identical in both         |
| `SITE_URL`                    |   ✅   |        ✅        | Comma-separated origins           |
| `MPESA_CONSUMER_KEY`          |   ✅   |        ✅        |                                   |
| `MPESA_CONSUMER_SECRET`       |   ✅   |        ✅        |                                   |
| `MPESA_SHORTCODE`             |   ✅   |        ✅        |                                   |
| `MPESA_PASSKEY`               |   ✅   |        ✅        |                                   |
| `MPESA_ENVIRONMENT`           |   ✅   |        ✅        | `sandbox` or `production`         |
| `MPESA_CALLBACK_URL`          |   ✅   |        ✅        | Must be your Vercel URL           |
| `RESEND_API_KEY`              |   ✅   |        ✅        |                                   |
| `EMAIL_FROM`                  |   ✅   |        ✅        |                                   |
| `GEMINI_API_KEY`              |   ✅   |        ✅        |                                   |
| `GOOGLE_CLIENT_ID`            |   ✅   |        ✅        |                                   |
| `GOOGLE_CLIENT_SECRET`        |   ✅   |        ✅        |                                   |
| `GT_API_KEY`                  |   ✅   |        ✅        |                                   |
| `GT_PROJECT_ID`               |   ✅   |        ✅        |                                   |

> `NEXT_PUBLIC_*` variables only need to be in Vercel — they're embedded into the frontend at build time and are not secret.

---

## 🛠️ Common Issues

### `Cannot find module '@convex-dev/rate-limiter/convex.config.js'`

Make sure your `convex/tsconfig.json` uses `"moduleResolution": "Bundler"` (capital B) and the `exclude` array only contains `"./_generated"`:

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

Also ensure `@convex-dev/rate-limiter` is in your `package.json` dependencies:

```bash
bun add @convex-dev/rate-limiter
```

### M-Pesa callback not firing locally

Use [ngrok](https://ngrok.com) to expose your local server:

```bash
ngrok http 3000
```

Set `MPESA_CALLBACK_URL` to the generated `https://` ngrok URL.

### Google OAuth redirect mismatch

Make sure both of these are added to your Google Cloud OAuth credentials:

- Authorized origins: `http://localhost:3000`
- Redirect URI: `http://localhost:3000/api/auth/callback/google`

---

## 📁 Project Structure

```
transport-me/
├── app/                    # Next.js App Router pages and API routes
│   └── api/
│       └── mpesa/          # M-Pesa callback handler
├── convex/                 # Convex backend functions, schema, config
│   ├── convex.config.ts    # Convex app config (Better Auth + Rate Limiter)
│   ├── schema.ts           # Database schema
│   └── tsconfig.json       # Convex TypeScript config (must use moduleResolution: Bundler)
├── components/             # Shared React components
├── lib/                    # Utility functions and client setup
├── .env.example            # Template for environment variables
└── README.md
```

---

## 📜 Scripts

| Command               | Description                                      |
| --------------------- | ------------------------------------------------ |
| `bun run dev`         | Start Next.js + Convex dev watchers concurrently |
| `bun run dev:next`    | Start Next.js only                               |
| `bun run dev:convex`  | Start Convex dev watcher only                    |
| `bun run build`       | Production build                                 |
| `bun run check-types` | TypeScript type check                            |
| `bun run lint`        | ESLint                                           |
| `bun run format`      | Prettier format                                  |

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.
