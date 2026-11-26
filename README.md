# HunarLink (Demo Prototype)

**Connecting Skills, Creating Opportunities.**

**Find a skilled worker. Agree on a price.**

| | |
| --- | --- |
| 🌐 **Live Demo** | https://itshunarlink-platform.vercel.app/ |
| 📊 **Presentation** | https://docs.google.com/presentation/d/1clSx7Qzmnz9vnVauH_7mNLKWoa9RV4uw/edit?usp=drivesdk&ouid=113691092200144095971&rtpof=true&sd=true |

> **Demo Notice:** HunarLink is a **frontend-only clickable demo prototype**. All workers, jobs, prices, chat conversations, reviews, earnings records, and badges are sample demo data stored only in your browser's `localStorage`. No backend, no real email or SMS, and no real money movement exist in this version. Please do not enter real personal information.

---

## Overview

HunarLink connects Pakistani homeowners and small businesses with local skilled workers and contractor teams across **Wah Cantt, Rawalpindi, Islamabad, and Taxila**.

- **Price negotiation (inDrive-style):** Customers post what work they need and their area (no house numbers). Matching nearby workers send their PKR price, suggest or answer counteroffers (24-hour expiry, 10-round cap), and agree before work starts.
- **Proof-of-work profiles (LinkedIn-style):** Workers share past work galleries and daily job progress updates with photos and notes, plus demo "Checked" badges.
- **Full English and Urdu support:** Switch between English (LTR) and اردو (RTL) at any time. Only one language shows at a time.

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
| `src/data/reducer.ts` | Single shared `AppState` reducer enforcing role ownership, negotiation rules, fee math, and storage schema |
| `src/data/store.tsx` | React Context + `localStorage` persistence + cross-tab `storage` sync |
| `src/utils/` | Pure domain rules (`matching.ts`, `negotiations.ts`, `expiry.ts`, `pricing.ts`, `reviews.ts`, `chatSafety.ts`, `photoSafety.ts`, `storage.ts`, `validation.ts`) |
| `src/i18n/` | English (`en.ts`) and Urdu (`ur.ts`) translation dictionaries |
| `src/pages/` | Public landing, login and info pages, plus separate Customer and Worker experiences |
| `vercel.json` | SPA rewrite rule + security headers (`CSP`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) |

---

## Login and Demo Accounts

### Ways to log in
- **Create Account:** full name, email, password and confirm password, with the role (Customer or Worker) saved on the account. Passwords are hashed in the browser. Accounts exist on **one device only**.
- **Sign In:** email and password. The account's saved role decides the dashboard.
- **Continue as Guest (Try Demo):** enter any display name and choose Customer or Worker. Guest sessions are clearly marked as demo.

### Sample accounts

| Account | Role | Sample Profile / Area |
| --- | --- | --- |
| **Customer Demo** | Customer | Ayesha Khan · Lalarukh, Wah Cantt |
| **Worker Demo** | Individual Worker | Ali Raza · Plumber · Wah Cantt |
| **Contractor / Team Demo** | Contractor Team (5 workers) | Hassan Construction Team · Rawalpindi and Wah Cantt |

---

## 3-Minute Demo Script

You can test end-to-end flows immediately or launch prebuilt scenarios from **Demo Tools**.

### Scenario A — Plumber Repair (1 Worker, Wah Cantt)
1. Continue as **Customer** (Sign In, Create Account, or Guest).
2. Open **Post a Request** and post a Plumbing job in **Lalarukh, Wah Cantt** for 1 worker (for example Rs 2,200).
3. Log out and continue as **Worker Demo (Ali Raza)**.
4. Open **Job Requests Near Me**, open the request, and **Send My Price** (for example **Rs 1,800**).
5. Log back in as the customer, open **My Requests**, then counter or **Accept and Confirm Job**.
6. As the worker, open **My Bookings** and mark **Work Started**, then **In Progress**, then **Completed**.
7. Check **Earnings and Our Fee**, then leave a 5-star review as the customer.

### Scenario B — Contractor Team Job (4 Workers, Rawalpindi)
1. As the customer, post a Renovation or Construction request in **Satellite Town, Rawalpindi** needing **4 workers**.
2. Log in as **Hassan Construction Team** (Worker login, or via **Demo Tools**).
3. Send a team price (5 workers included) from **Job Requests Near Me**, then accept and complete it from **My Bookings**.

---

## Our Fee Example (5%, Worker Side Only)

Customers always pay **Rs 0 platform fee**. Only completed jobs record a 5% worker-side fee:

- **Agreed Job Value:** `Rs 1,800`
- **Our Fee (5%):** `Rs 90` (`Math.round(1800 * 0.05)`)
- **Worker Receives:** `Rs 1,710`
- **Cancelled / Declined / Unfinished Jobs:** `Rs 0` fee and no earnings record

*(Demo fee rate for prototype evaluation. The final rate is subject to business review.)*

---

## What Is Simulated vs. What a Production App Needs

### Simulated in This Prototype
- **Authentication:** Local accounts (name, email, hashed password) and guest demo mode, stored in one browser only. No email is sent or checked, and there is no password reset or server session.
- **Database and Cross-Device Sync:** State is saved only in one browser's `localStorage` (synced across tabs in the same browser).
- **Notifications and Chat:** Shared across roles on the same browser. No push notifications, SMS, WhatsApp, or WebSockets.
- **Payments and Balances:** The 5% fee and `Done (demo)` payouts are math previews only. No Easypaisa, JazzCash, bank transfer, or card processing.
- **Checked Badges and Area GPS:** Badges are demo labels (`Checked (Demo)`). Optional GPS snaps only to the nearest area and does not save coordinates.

### Required for a Real Production Release
1. Real backend API and database (for example PostgreSQL) with server-side authorization and audit logs.
2. Real authentication (for example Supabase Auth) with email or phone OTP, CNIC and skill verification, and server-issued sessions.
3. Real payment gateway integration (JazzCash, Easypaisa, Raast, or bank settlement).
4. Push notifications, SMS fallback, and real-time chat with moderation.
5. Cloud image storage with server-side EXIF stripping and malware scanning.

---

## Deploying to Vercel

1. Push this repository to GitHub, GitLab, or Bitbucket (or run `npx vercel` directly).
2. Import the project in **Vercel**.
3. Confirm settings (Vite is auto-detected):
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Leave Environment Variables empty (none required).
5. Deploy. `vercel.json` enables client-side SPA routing and HTTP security headers.

---

## Team

<Moniza Khan & Ansa Arif>
