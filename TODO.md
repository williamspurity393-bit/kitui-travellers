# Kitui Travellers — Remaining TODOs

# Updated after session 3. All critical and most high/medium items DONE.

## ✅ COMPLETED (this + previous sessions)

- [x] convex/schema.ts — driverEarnings, systemSettings tables
- [x] convex/vehicles.ts — full CRUD
- [x] convex/reviews.ts — full CRUD + admin respond
- [x] convex/driverEarnings.ts — auto-created on payment
- [x] convex/payments.ts — ResultCode string/number fix, driver earnings
- [x] convex/systemSettings.ts — admin-controlled config
- [x] convex/bookings.ts — KT- prefix, bulk cancel, completion, email hooks
- [x] convex/schedules.ts — auto-complete bookings on arrival
- [x] convex/email.ts — Resend email templates (booking confirm, cancel, complete)
- [x] admin/vehicles, reviews, promos, reports, settings, users, drivers, bookings
- [x] driver/earnings, passengers, vehicle, profile
- [x] user/bookings (QR placeholder + review flow), notifications, profile
- [x] auth/forgot-password, auth/reset-password
- [x] (public)/about, privacy, terms, contact
- [x] routes/ — public route browser with schedule + review display
- [x] Trip lifecycle: driver marks "arrived" → bookings auto-completed → review prompt
- [x] Branding: KT- booking codes (was TM-)

---

## 🔴 CRITICAL REMAINING

### 1. `npx convex deploy` — run after placing all files

New tables require deployment before the app works:

```bash
npx convex deploy
```

### 2. Wire email.ts into payments.ts

`convex/email.ts` is created but not yet called.
In `convex/payments.ts:handleMpesaCallback` (on success), add:

```typescript
// After creating wallet transaction, add:
// Requires user email — fetch from better-auth session or store in userProfiles
// await ctx.scheduler.runAfter(0, internal.email.sendBookingConfirmed, {
//   toEmail: userEmail,
//   bookingCode: booking.bookingCode,
//   passengerName: booking.passengers[0].name,
//   origin: route.origin,
//   destination: route.destination,
//   departureTime: schedule.departureTime,
//   passengerCount: booking.passengers.length,
//   totalAmount: payment.amount,
//   mpesaReceipt: args.mpesaReceiptNumber,
// });
```

Full implementation needs user email stored in `userProfiles.email`.

### 3. Add email field to userProfiles schema

```typescript
// In schema.ts userProfiles table:
email: v.optional(v.string()),

// In users.ts completeOnboarding, store the email from better-auth:
// email: identity.email ?? undefined,
```

### 4. Set RESEND_API_KEY in Convex

```bash
npx convex env set RESEND_API_KEY re_xxxxxxxxxxxx
npx convex env set EMAIL_FROM "Kitui Travellers <noreply@kuittravellers.co.ke>"
```

Get API key at resend.com (free: 3,000 emails/month).

---

## 🟡 HIGH PRIORITY

### 5. M-Pesa B2C — Real Driver Disbursement

Admin "Disburse" button sets status in DB only. No actual payment sent.
Steps:

1. Register M-Pesa B2C shortcode on Daraja portal (requires business docs)
2. Set env vars: MPESA_B2C_SHORTCODE, MPESA_INITIATOR_NAME, MPESA_INITIATOR_PASSWORD
3. Create app/api/b2c/disburse/route.ts → call mpesa.b2cPayment()
4. Create app/api/b2c/result/route.ts → receive Safaricom callback
5. Update convex/driverEarnings.ts:markDisbursed → call API, set "processing"
6. Callback handler sets "disbursed" or "failed" + stores mpesaReference

### 6. Real QR Code

```bash
bun add react-qr-code
```

In app/user/bookings/page.tsx, replace BookingQR component:

```tsx
import QRCode from "react-qr-code";
// Replace the placeholder SVG div with:
<QRCode value={code} size={128} bgColor="white" fgColor="#0a0a0a" />;
```

---

## 🟢 MEDIUM PRIORITY

### 7. Seat Hold / Lock System (race condition)

Two users can currently select the same seat simultaneously.
Steps:

1. Add `seatHolds` table to schema:
   `{scheduleId, seatNumber, userId, expiresAt: number}`
2. Add `holdSeats` mutation — expires in 10 minutes
3. Add `releaseSeats` mutation
4. Check holds in createBooking before confirming seats
5. Add Convex cron (crons.ts) to clean expired holds every 5 minutes

### 8. Avatar Upload

Schema field `avatar` exists but no upload UI.
Steps:

1. Use Convex file storage: `ctx.storage.generateUploadUrl()`
2. In users.ts: add `updateAvatar` mutation storing storage URL
3. Add avatar upload component to user/profile page

### 9. Multilingual Support (SRS §6.2 — English + Swahili)

```bash
bun add next-intl
```

1. Create messages/en.json and messages/sw.json
2. Wrap app in NextIntlClientProvider
3. Add language toggle to nav

### 10. Admin: Schedule Completion button

On admin schedules page, add "Complete Trip" button that calls:
`api.schedules.adminCompleteSchedule` — marks schedule "arrived"
and auto-completes all confirmed bookings.

---

## 🔵 LOW PRIORITY

### 11. SMS Notifications

Sign up at africastalking.com or twilio.com.
Send SMS on booking confirmation + payment receipt.

### 12. Route Map (SRS REQ-6)

Add waypoints to routes schema.
Use Leaflet (free) or Google Maps to display route polyline.

### 13. Booking PDF Export

```bash
bun add jspdf
```

Add "Download PDF" button on booking detail showing code, route, passengers, receipt.

### 14. Admin Analytics (peak times, popular routes, retention)

Extend reports page with hourly booking distribution chart.

### 15. Rate Limiting — Upstash Redis (production)

Current in-memory rate limit resets on function restart.

```bash
bun add @upstash/ratelimit @upstash/redis
npx convex env set UPSTASH_REDIS_REST_URL https://...
npx convex env set UPSTASH_REDIS_REST_TOKEN ...
```

### 16. Delete Account (GDPR/Data Protection Act compliance)

Add to user/profile page:

- "Delete my account" → mutation that deletes userProfiles row + anonymizes bookings

---

## ENV VARS CHECKLIST

```
# Already set (production):
CONVEX_DEPLOYMENT=...
NEXT_PUBLIC_CONVEX_URL=...
BETTER_AUTH_SECRET=...
SITE_URL=https://transport-me.vercel.app
NEXT_PUBLIC_SITE_URL=https://transport-me.vercel.app
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_SHORTCODE=174379
MPESA_PASSKEY=...
MPESA_ENVIRONMENT=sandbox
MPESA_CALLBACK_URL=https://transport-me.vercel.app/api/mpesa/callback

# Still needed:
RESEND_API_KEY=re_xxxxxxxxxxxx          ← email notifications
EMAIL_FROM=Kitui Travellers <noreply@...>

# Future (B2C):
MPESA_B2C_SHORTCODE=
MPESA_INITIATOR_NAME=
MPESA_INITIATOR_PASSWORD=
MPESA_B2C_RESULT_URL=
MPESA_B2C_QUEUE_URL=
```
