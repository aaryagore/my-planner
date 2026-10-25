# ✦ My Planner — Stay Organized, Stay Calm

A modern, intentional personal planner web app designed to help you stay organized and consistent without feeling overwhelmed. Built with Next.js 16, Google Firebase (Spark Free Tier), and designed for zero-cost deployment on Vercel.

---

## 🌟 Key Features

- **📋 Today's Dashboard**: Greeting, live task metrics, Top 3 daily priorities with direct completion toggling, time-block preview, and habit consistency bars.
- **📥 Quick Capture Inbox**: Capture to-dos and thoughts instantly with priority tags (Urgent, Important, Optional), due dates, and Top 3 pinning. Includes filter tabs (All, Active, Top 3, Completed).
- **⏱️ Focus Timer (Pomodoro)**: 25m Focus, 5m Short Break, and 15m Long Break intervals with circular animated countdown, task attachment, session logging, and zero-asset synthesized audio chime.
- **🎯 Habits Tracker**: Zero-guilt weekly frequency targets (e.g., 3×/week) instead of all-or-nothing streaks. Includes custom habit creation modal with emojis and colors.
- **📅 Calendar & Time Blocking**: Hourly scheduler (08:00 – 18:00) with task-to-slot assignment, custom accent colors, and monthly overview grid.
- **📁 Projects Hub**: Organize related tasks into dedicated workspace categories.
- **📊 Daily Review**: End-of-day reflection notepad and completed accomplishments archive.
- **🎨 Glassmorphic Design System**: Modern aesthetic with fluid micro-interactions, dark/light mode toggle, and responsive mobile navigation drawer.
- **🔒 Free-Tier Cloud Authentication**: Google Sign-in and Email/Password authentication powered by Firebase Auth Spark plan ($0 forever).

---

## 💰 Zero-Cost Architecture ($0.00 Forever)

This project is strictly designed for **100% free hosting and usage**:
- **Next.js 16 (App Router)**: Open-source (MIT).
- **Firebase Authentication**: Unlimited email & Google sign-in users (Spark Plan).
- **Cloud Firestore**: 50,000 reads/day, 20,000 writes/day, 1 GB storage (Spark Plan).
- **Vercel**: 100 GB bandwidth/month, 100k serverless function executions (Hobby Plan).
- **Browser Native APIs**: Audio synthesized locally via Web Audio API.

For detailed quotas, monitoring steps, and cost protection safeguards, read the [FREE_TIER_GUIDE.md](./FREE_TIER_GUIDE.md).

---

## 🚀 Running Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables (Optional for Demo Mode)
The app runs out-of-the-box in **instant local demo mode** with localStorage persistence!

To connect your real Firebase database and Google sign-in:
1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
2. Fill in your Firebase Web App credentials from the [Firebase Console](https://console.firebase.google.com/):
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploying to Vercel (Free)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "feat: complete personal planner web app"
   git remote add origin https://github.com/YOUR_USERNAME/my-planner.git
   git push -u origin main
   ```
2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com) and log in with GitHub.
   - Click **"Add New..."** → **Project**.
   - Select your `my-planner` repository.
3. **Add Environment Variables**:
   - In Vercel's project setup screen, expand **Environment Variables**.
   - Copy the 6 `NEXT_PUBLIC_FIREBASE_*` variables from your `.env.local`.
4. **Deploy**:
   - Click **Deploy**. Within 60 seconds, your planner will be live at `https://your-project.vercel.app` with free SSL and automatic redeployment on git push!

---

## 🛠️ Project Structure

```
My_To_Do/
├── FREE_TIER_GUIDE.md       # Zero-cost guide & quota documentation
├── README.md                # Project overview & deployment guide
├── public/                  # Static assets
└── src/
    ├── app/
    │   ├── globals.css      # Core design tokens, typography & animations
    │   ├── layout.js        # Root layout with Providers & Sidebar
    │   ├── page.js          # Redirects root to /dashboard
    │   ├── dashboard/       # Main dashboard view & stats
    │   ├── inbox/           # Interactive tasks & filter tabs
    │   ├── calendar/        # Time blocking & monthly calendar
    │   ├── focus/           # Pomodoro focus timer with Web Audio
    │   ├── habits/          # Weekly consistency habit tracker
    │   ├── projects/        # Project workspaces hub
    │   └── review/          # Reflection notepad & completion archive
    ├── components/
    │   ├── Sidebar.js       # Desktop & mobile responsive sidebar
    │   ├── AuthModal.js     # Google Sign-in & Email authentication modal
    │   ├── TaskModal.js     # Quick Capture task dialog
    │   └── Providers.js     # Client Context wrapper
    ├── context/
    │   └── AuthContext.js   # Global Firebase user state
    └── lib/
        ├── firebase.js      # Firebase SDK client initialization
        ├── tasksService.js  # Firestore tasks CRUD & demo fallback
        └── habitsService.js # Firestore habits tracking & demo fallback
```

---

## 🎓 Continuing Development (Self-Maintenance Tips)

- **Adding a new route**: Create a new folder inside `src/app/<route-name>` with a `page.js` file and add the link to `NAV_SECTIONS` in `src/components/Sidebar.js`.
- **Modifying Theme Colors**: Open `src/app/globals.css` and adjust the CSS variables under `:root` and `[data-theme="dark"]`.
- **Staying Free**: Always keep Firebase on the **Spark plan** and Vercel on the **Hobby plan**.
