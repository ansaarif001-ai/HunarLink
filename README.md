# HunarLink (Demo Prototype)

> **Demo Notice:** HunarLink is a **frontend-only clickable demo prototype**. All workers, jobs, prices, chat conversations, reviews, earnings records, and badges are sample demo data stored only in your browser's `localStorage`. No backend, no real authentication, no SMS/calls, and no real money movement exist in this version.

---

## Overview

HunarLink connects Pakistani homeowners and small businesses with local skilled workers and contractor teams across **Wah Cantt, Rawalpindi, Islamabad, and Taxila**.

- **Price negotiation (inDrive-style):** Customers post what work they need and their area (no house numbers). Matching nearby workers send their PKR price, suggest or answer counteroffers (24-hour expiry, 10-round cap), and agree before work starts.
- **Proof-of-work profiles (LinkedIn-style):** Workers share past work galleries and daily job progress updates with real photos, notes, and verified demo badges.
- **Full English & Urdu support:** Switch cleanly between English (LTR) and اردو (RTL) anytime.

---

## How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Start local dev server on port 3000
npm run dev

# 3. Type-check and create production build
npm run lint
npm run build
```

No environment variables or API keys are needed.

---

## Project Structure

| Path | Purpose |
| --- | --- |
| `src/App.tsx` | Route tree, role-protected views, and lazy-loaded route bundles |
| `src/layouts/MainLayout.tsx` | Responsive top bar (4 role nav items + Chat + Alerts + Profile), mobile bottom bar, RTL/LTR shell |
| `src/data/seedData.ts` | 15 categories, 12+ Pakistani demo workers, sample jobs, chat conversations, reviews, and earnings |
| `src/data/reducer.ts` | Single shared `AppState` reducer enforcing strict role ownership, negotiation rules, fee math, and storage schema |
| `src/data/store.tsx` | React Context + `localStorage` persistence (`hunarlink_app_v3`, `schemaVersion: 8`) + cross-tab `storage` sync |
| `src/utils/` | Pure domain rules (`matching.ts`, `negotiations.ts`, `expiry.ts`, `pricing.ts`, `reviews.ts`, `chatSafety.ts`, `photoSafety.ts`, `storage.ts`, `validation.ts`) |
| `src/i18n/` | Complete 1:1 English (`en.ts`) and Urdu (`ur.ts`) translation dictionaries |
| `src/pages/` | Public landing/login/info pages plus separate Customer and Worker experiences |
| `vercel.json` | SPA rewrite rule + security headers (`CSP`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) |

---

## Fixed Demo Accounts

| Account | Role | Sample Profile / Area |
| --- | --- | --- |
| **Customer Demo** (`cust_demo`) | Customer | Ayesha Khan · Lalarukh, Wah Cantt |
| **Worker Demo** (`wrk_ali_raza`) | Individual Worker | Ali Raza · Plumber · Wah Cantt (Lalarukh, Model Town, Officer Colony, Officer Mess, Mall Road, The Mall, Shadman Town) |
| **Contractor / Team Demo** (`wrk_hassan_team`) | Contractor Team (5 workers) | Hassan Construction Team · Rawalpindi & Wah Cantt |

---

## 3-Minute Demo Script

You can test end-to-end flows immediately or launch prebuilt scenarios from `/demo-helper`:

### Scenario A — Plumber Repair (1 Worker, Wah Cantt)
1. Click **Continue as Customer** -> **Continue with Customer Demo**.
2. Open **Post Request** (or use **Scenario A** on **Demo Helper**), post a Plumbing job in **Lalarukh, Wah Cantt** for 1 worker (e.g. Rs 2,200).
3. Log out and click **Continue as Worker** -> **Continue with Worker Demo (Ali Raza)**.
4. Check **Alerts** or **Jobs Near Me** -> open the request -> **Send My Price** (example: **Rs 1,800**).
5. Switch back to **Customer Demo** -> open **My Requests** -> counteroffer or tap **Accept & Confirm Job**.
6. Switch back to **Worker Demo** -> open **Confirmed Jobs** -> mark **Work Started** -> **In Progress** -> **Completed**.
7. Check **Earnings & Our Fee** (and switch back to **Customer Demo** to leave a 5-star review on **My Requests**).

### Scenario B — Contractor Team Job (4 Workers, Rawalpindi)
1. As **Customer Demo**, post a Renovation/Construction request in **Satellite Town, Rawalpindi** needing **4 workers**.
2. Log in as **Hassan Construction Team** (button under Worker login or via **Demo Helper**).
3. Send a team price (5 workers included) from **Jobs Near Me** -> accept and complete it from **Confirmed Jobs**.

---

## Our Fee Example (5%, Worker Side Only)

Customers always pay **Rs 0 platform fee**. Only completed jobs record a 5% worker-side fee:

- **Agreed Job Value:** `Rs 1,800`
- **Our Fee (5%):** `Rs 90` (`Math.round(1800 * 0.05)`)
- **Worker Receives:** `Rs 1,710`
- **Cancelled / Declined / Unfinished Jobs:** `Rs 0` fee and `0` earnings transaction

*(Demo fee rate shown for prototype evaluation; final rate subject to business review.)*

---

## What Is Simulated vs. What a Production App Needs

### Simulated in This Prototype
- **Authentication:** One-click demo role switching (`Guest` / `Customer` / `Worker`) and local demo names with no passwords, OTPs, or JWT sessions.
- **Database & Cross-Device Sync:** State is saved only in one browser's `localStorage` (`hunarlink_app_v3`, synced across same-browser tabs).
- **Notifications & Chat:** Shared across roles on the same browser; no push notifications, SMS, WhatsApp, or WebSockets.
- **Payments & Balances:** 5% fee and `Done (demo)` payouts are math previews only; no Easypaisa, JazzCash, bank transfer, or card processing.
- **Checked Badges & Area GPS:** Checked badges are demo labels (`Checked (Demo)`). Optional GPS snaps only to the nearest neighborhood center without saving coordinates.

### Required for a Real Production Release
1. Real backend API + database (e.g. PostgreSQL / Firestore) with server-side authorization and audit logs.
2. Phone/OTP authentication, CNIC/skill verification workflow, and server-issued session tokens.
3. Real payment gateway integration (JazzCash / Easypaisa / Raast / bank settlement ledger).
4. Push notifications, SMS fallback, and real-time WebSocket chat with server-side moderation.
5. Image CDN / cloud object storage with server-side EXIF stripping and malware scanning.

---

## Deploying to Vercel

1. Push this repository to GitHub, GitLab, or Bitbucket (or run `npx vercel` directly).
2. Import the project in **Vercel**.
3. Confirm settings (Vite auto-detected):
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Leave Environment Variables empty (none required).
5. Deploy. `vercel.json` automatically enables client-side SPA routing and HTTP security headers.
