# 💰 Zero-Cost Architecture & Free-Tier Guide

> **Guaranteed $0 Cost for Learning & Student Deployment**  
> Every service and library selected in this project operates 100% within generous, permanent free tiers. No credit card is required, no billing accounts are enabled, and hard quotas prevent any surprise charges.

---

## 📌 Executive Summary

| Service | Plan / Tier | Cost | Quota Enforcement | Can It Charge You? |
|---|---|---|---|---|
| **Next.js 16** | Open Source (MIT) | **$0.00** | Unlimited local & client execution | **No** |
| **Firebase Auth** | Spark Plan (Free) | **$0.00** | Unlimited email/password & Google sign-ins | **No** (No billing account) |
| **Cloud Firestore** | Spark Plan (Free) | **$0.00** | 50,000 reads/day, 20,000 writes/day, 1 GB storage | **No** (Hard cap; requests pause until daily reset) |
| **Vercel** | Hobby Plan (Free) | **$0.00** | 100 GB bandwidth/mo, 100k function invocations/mo | **No** (Hard cap for personal/student use) |
| **GitHub** | Free Plan | **$0.00** | Unlimited public/private repositories | **No** |
| **Total Monthly Cost** | | **$0.00** | | **$0.00 Forever** |

---

## 🛠️ Service-by-Service Free-Tier Deep Dive

### 1. Next.js 16 (App Router)
- **Cost**: Free & open-source software.
- **Why we chose it**: Modern React architecture, server and client components, fast routing, and zero licensing fees.
- **Rules applied**: We avoid paid third-party enterprise plugins or edge middleware networks that require paid subscriptions.

### 2. Firebase — Spark Plan (Free Tier)
Firebase offers two tiers: **Spark (Free)** and **Blaze (Pay-as-you-go)**.  
> ⚠️ **The Golden Rule**: **Never click "Upgrade to Blaze"**. As long as the project stays on the Spark plan, Firebase does not even have credit card details and **cannot bill you**.

#### A. Firebase Authentication
- **Free Quota**:
  - Email & Password accounts: **Unlimited**
  - Google Sign-In (OAuth): **Unlimited**
  - Daily active sign-ins: **Unlimited**
- **Excluded Features**: Phone/SMS Authentication (SMS text delivery carries per-message fees on Blaze). We use pure Google sign-in and email/password.

#### B. Cloud Firestore (NoSQL Database)
- **Free Quota (resets every midnight Pacific Time)**:
  - **Reads**: `50,000` documents per day
  - **Writes**: `20,000` documents per day
  - **Deletes**: `20,000` documents per day
  - **Total Storage**: `1 GB`
  - **Network Egress**: `10 GB` per month
- **Realistic usage for our personal planner**:
  - A typical day of heavy planning uses ~150–500 reads and 50–100 writes.
  - The free tier provides enough capacity for **50+ active daily users** without spending a cent.
- **What happens if a limit is reached?**
  - Firestore returns a `resource-exhausted` quota error.
  - The application displays a friendly fallback notification ("Daily free quota reached. Resets at midnight PT!").
  - **You are NOT billed.** Reads/writes simply pause until the reset.

#### C. Firebase Storage & Cloud Functions
- **Deliberately Avoided**:
  - We do not use Cloud Functions (which require the Blaze plan for outbound network access). Instead, server logic runs on Next.js API route handlers on Vercel for free.
  - File/image uploads are not needed for planning; markdown notes and checklists are stored directly as JSON in Firestore documents.

### 3. Vercel — Hobby Plan (Hosting & Serverless)
- **Free Quota**:
  - Deployments: **Unlimited**
  - Bandwidth: **100 GB** per month (a text/data app typically consumes < 1 GB/mo)
  - Serverless Function Invocations: **100,000** per month
  - Serverless Execution Time: 10 seconds max per request (our routes execute in < 100ms)
  - Custom Domains & Automated HTTPS (SSL): **Included for free**
  - Build Minutes: **6,000 minutes/month** (~6,000 deploys)
- **Compliance**: Vercel Hobby is free for personal projects, portfolios, and student learning.

### 4. Browser Native APIs (Free Notifications)
- Instead of paying for third-party push notification services (such as OneSignal or Twilio), we utilize:
  - The standard Web **Notification API** for desktop/mobile alerts.
  - In-app toast/banner alerts with CSS animations.
  - Completely free, privacy-first, zero vendor lock-in.

---

## 🚫 Features & Services Deliberately Avoided

| Service / Feature | Why Avoided | Zero-Cost Alternative Used |
|---|---|---|
| Firebase Blaze Plan | Requires credit card; risk of auto-charges | Firebase Spark Plan (Hard Free Cap) |
| SMS / Phone Verification | Telecom carrier fees | Google Sign-In & Email Auth |
| Firebase Cloud Functions | Requires paid plan for external calls | Next.js API Routes (Vercel Hobby) |
| Cloud Storage (Buckets) | Storage limits & egress charges | Document fields in Firestore |
| Paid Push Notifications | Monthly subscriber tiers | Web Notifications API & UI Badges |
| Vercel Pro | $20/month per seat | Vercel Hobby (Personal/Student) |

---

## 🔍 How to Monitor Usage & Stay in Control

### Checking Firebase Usage
1. Open the [Firebase Console](https://console.firebase.google.com).
2. Select your project.
3. Look at the bottom-left corner of the sidebar: confirm it displays **Spark Plan**.
4. Click **Usage and billing** to view live charts of document reads, writes, and storage.

### Checking Vercel Usage
1. Open the [Vercel Dashboard](https://vercel.com/dashboard).
2. Select your project → Navigate to the **Usage** tab.
3. Review your bandwidth and serverless function invocations.

---

## 🚀 Work Completed in the Project So Far

### Stage 0: Architecture & Zero-Cost Validation
- Established a modern Next.js 16 + Firebase Spark + Vercel Hobby stack.
- Formulated the zero-cost guarantee and budget architecture.

### Stage 1: App Skeleton & Navigation System
- Initialized Next.js project with clean dependencies.
- Created the core responsive layout with:
  - Collapsible desktop sidebar with active route highlighting and badges.
  - Mobile header with hamburger menu drawer and backdrop overlay.
  - Theme toggler foundation (Light / Dark mode).
- Built all primary placeholder views:
  - `src/app/dashboard` — Today's plan, Top 3 priorities, schedule blocks, habits mini-tracker, upcoming deadlines.
  - `src/app/inbox` — Quick capture inbox for ideas and unorganized tasks.
  - `src/app/calendar` — Day/Week/Month calendar views.
  - `src/app/focus` — Pomodoro / timed focus session module.
  - `src/app/habits` — Weekly consistency tracking without streak guilt.
  - `src/app/projects` — Multi-task project organization.
  - `src/app/review` — Daily check-ins and weekly reflection summaries.

### UI & Aesthetics Upgrade
- Implemented a design system in `src/app/globals.css`:
  - Curated HSL color palette (Primary Indigo, Accent Teal, Warm Amber, Soft Coral).
  - Modern typography with Google Fonts (`Inter` for UI, `JetBrains Mono` for time and stats).
  - Glassmorphic card styling with backdrop blur and delicate translucent borders.
  - Micro-interactions: button hover lift, tactile click scale, pulse animations, smooth spring transitions.
  - Full Dark Mode support via `[data-theme="dark"]`.
- Fixed Next.js 16 client hydration mismatch (`blocking-prerender-current-time-client`) by deferring time computation to client-side `useEffect`.
- Added `data-scroll-behavior="smooth"` to `<html>` to ensure route transitions are warning-free.

### Stage 2 & Stage 3: Firebase SDK & Authentication Integration ✅
- Installed official client SDK `firebase@^13.1.0`.
- Built safe initialization module `src/lib/firebase.js` with client/server compatibility and automatic fallback to demo mode if credentials are unconfigured.
- Created global `AuthContext` provider (`src/context/AuthContext.js`) with support for:
  - Google Sign-In with popup OAuth (`signInWithGoogle`)
  - Email & Password sign-in (`signInWithEmail`)
  - New user registration (`signUpWithEmail`)
  - Safe sign-out (`logout`)
  - Real-time `onAuthStateChanged` listener with error handling
- Created modern glassmorphic `AuthModal` dialog (`src/components/AuthModal.js` & `AuthModal.css`).
- Integrated auth state directly into `Sidebar.js`:
  - Unauthenticated: displays a prominent "Connect Account" / "Sign in" button.
  - Authenticated: displays user avatar / Google profile photo, display name, and one-click sign-out.
- Ensured `.env.local` is ignored in `.gitignore` so secrets are never pushed to GitHub.

---

## 📋 Step-by-Step: Connecting Your Free Firebase Project

To activate live cloud storage and Google authentication:

1. **Create Free Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/) → **Add project**.
   - Name: `my-planner-app` → Finish creation on the **Spark (Free)** plan.
2. **Enable Auth Providers**:
   - **Build** → **Authentication** → **Get Started**.
   - **Google**: Enable → select support email → Save.
   - **Email/Password**: Enable → Save.
3. **Enable Firestore Database**:
   - **Build** → **Firestore Database** → **Create database**.
   - Select closest region → choose **Start in test mode** for development.
4. **Copy Web Credentials**:
   - Project Settings (⚙️ icon) → Scroll down to **Your apps** → Click Web (`</>`).
   - Register app `My Planner Web` → copy the keys to `.env.local`:
     ```env
     NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=my-planner-app.firebaseapp.com
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=my-planner-app
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=my-planner-app.appspot.com
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
     NEXT_PUBLIC_FIREBASE_APP_ID=1:...:web:...
     ```

---

## 🗺️ Next Stages Roadmap

- [x] **Stage 0: Architecture & Zero-Cost Validation** (Completed)
- [x] **Stage 1: App Skeleton & Navigation System** (Completed)
- [x] **Stage 2: Firebase Client SDK Setup** (Completed)
- [x] **Stage 3: Authentication & Google Sign-In Modal** (Completed)
- [x] **Stage 4: Firestore Real-Time Tasks & Inbox** (Completed)
  - Created zero-cost Firestore task service (`src/lib/tasksService.js`) scoped strictly to `users/{uid}/tasks`.
  - Added real-time subscription (`onSnapshot`) with automatic daily read minimization.
  - Implemented automatic local storage demo fallback so tasks can be created, edited, and toggled immediately without setup.
  - Built Quick Capture Task modal (`src/components/TaskModal.js`) with priority tags (Urgent, Important, Optional) and Top 3 pinning.
  - Built interactive Inbox (`src/app/inbox/page.js`) with filter tabs (All, Active, Top 3, Completed) and completion toggles.
  - Connected live tasks to the Dashboard (`src/app/dashboard/page.js`), reflecting real-time stats and Top 3 priorities.
- [x] **Stage 5: Daily Schedule, Habits & Focus Timer** (Completed)
  - Interactive Pomodoro focus timer (`src/app/focus/page.js`) with circular progress countdown, preset durations (Focus 25m, Short Break 5m, Long Break 15m), active task linking, and synthesized Web Audio chime ($0, no network assets).
  - Real-time habits tracker (`src/lib/habitsService.js` and `src/app/habits/page.js`) with weekly frequency targets, plus/minus increment counters, and custom habit creator modal.
  - Interactive daily time-blocking schedule planner (`src/app/calendar/page.js`) with hourly slots, task attachment, highlight colors, and monthly overview grid.
  - Cross-module synchronization: Dashboard dynamically reflects live habit progress, focus counts, and schedule blocks.
- [x] **Stage 6: Final Polish & Vercel Free Deployment** (Completed)
  - Verified clean static production build (`npm run build`) in Turbopack with 0 warnings/errors across all 11 routes.
  - Completed interactive Project Hub (`src/app/projects/page.js`) and Daily Retrospective Review (`src/app/review/page.js`).
  - Added comprehensive step-by-step deployment guide to Vercel Hobby ($0 forever) via GitHub in `README.md`.
  - Created student self-maintenance guide and project architecture cheat-sheet.
