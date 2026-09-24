# 🕷️ Spidey Tracker

> A hyper-focused, retro-styled productivity ecosystem designed for deep work, habit building, and relentless accountability.

![Spidey Tracker](https://img.shields.io/badge/Productivity-800_Hours-red?style=for-the-badge&logo=target) ![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![Vite](https://img.shields.io/badge/Vite_8-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white) ![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black) ![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)

---

## 📖 Table of Contents

- [About The Project](#-about-the-project)
- [Core Features & Technical Implementation](#-core-features--technical-implementation)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Installation & Setup](#-installation--setup)
- [Challenges & Learnings](#-challenges--learnings)
- [Roadmap](#-roadmap)

---

## 🚀 About The Project

**Spidey Tracker** is not just another Pomodoro timer. It is a comprehensive accountability partner engineered to enforce deep work sessions and track long-term goals (like an 800-hour mastery challenge). 

It solves the common pitfalls of typical productivity apps by utilizing **Web Workers** for drift-free background counting, **Service Workers** for robust cross-tab notifications, and an aggressive **Site-Pinning** system that actively aborts your session if you succumb to digital distractions.

*(Insert UI Screenshots or GIFs here)*

---

## 🔥 Core Features & Technical Implementation

### 1. Drift-Free Background Timer (Web Worker)
Standard JavaScript `setInterval` and `requestAnimationFrame` APIs are aggressively throttled by modern browsers when a tab is in the background (dropping to 1 tick per minute). 
**The Solution:** The timer logic is offloaded to a dynamically instantiated **Web Worker blob**. This completely bypasses main-thread background throttling, ensuring the countdown remains perfectly synchronized to the wall clock even if the browser is minimized for hours.

### 2. Anti-Distraction Site Pinning
**How it works:**
Users can "pin" a specific URL to a study category (e.g., MERN Backend → `scrimba.com`).
When a pinned session starts:
1. The app automatically opens the target site.
2. It leverages the `visibilitychange` API to monitor the tracker's tab state.
3. **The Catch:** If the user returns to the tracker tab (meaning they left their study site) for longer than a predefined threshold (e.g., 3 minutes), the session is aggressively **auto-aborted** and no time is logged.

### 3. PWA-Ready Notification System
Integrated a robust notification system using the **Service Worker API**. Instead of relying on the fragile standard `new Notification()`, the app uses `navigator.serviceWorker.ready.showNotification()` when available. This guarantees delivery of session completion and auto-abort alerts across all operating systems, even when running as an installed Desktop PWA.

### 4. Comprehensive Analytics & Data Visualization
Built a full-scale analytics dashboard using `recharts` to visualize progress:
- **30-Day Heatmap:** Visualizes daily study intensity.
- **Weekly Trend Comparisons:** Aggregates and compares time spent per category week-over-week.
- **Habit/Relapse Tracking:** A 12-week GitHub-style contribution calendar for habit adherence.
- **Day Goals:** A granular daily task manager synced directly to Firebase, displaying 14-day completion rate trends.

### 5. Persistent State & Real-time Sync
- Active sessions are continuously serialized to `localStorage` to survive accidental page refreshes.
- Completed sessions, day goals, and habit logs are synced in real-time to **Firebase Firestore**, architected with multi-user isolation via Firebase Auth.

---

## 🛠 Architecture & Tech Stack

**Frontend Ecosystem:**
- **React 18** (Functional Components, Custom Hooks)
- **Vite 8** (Lightning-fast HMR, Rolldown for optimized chunk splitting)
- **Tailwind CSS** (Utility-first styling, custom retro glassmorphism design system)
- **Framer Motion** (Fluid micro-interactions, layout transitions, and SVG animations)
- **Recharts** (SVG-based charting for analytics)
- **Lucide React** (Consistent iconography)

**Backend & Infrastructure:**
- **Firebase Auth** (Secure user authentication)
- **Firebase Firestore** (NoSQL document database for scalable data storage)
- **Vite PWA Plugin** (Manifest generation, offline caching, installability)

---

## ⚙️ Installation & Setup

To run this project locally:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/spidey-tracker.git
   cd spidey-tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Firebase:**
   Create a `.env` file in the root directory and add your Firebase project credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Build for Production:**
   ```bash
   npm run build
   ```

---

## 🧠 Challenges & Learnings

- **Browser Resource Throttling:** Initially, the timer would drift significantly if the user opened another tab. I learned about browser macro-task throttling and solved this by implementing an inline Web Worker that posts tick messages back to the main thread.
- **PWA Service Worker Lifecycles:** Integrating reliable background notifications required deep diving into Service Worker registration constraints, especially handling the nuances between local development (where SWs aren't active) and production builds.
- **Complex State Management:** Managing the state of an active timer, interacting with the `document.visibilityState`, maintaining sync with `localStorage`, and triggering auto-aborts required highly careful orchestration inside the custom `useTimer` hook to prevent memory leaks and stale closures.

---

## 🗺️ Roadmap

- [ ] Implement Pomodoro intervals (e.g., 50/10 splits within a larger session).
- [ ] Add social accountability (Leaderboards or buddy system).
- [ ] Export data to CSV/JSON for personal data ownership.
- [ ] Implement an offline-first mode using Firestore's local cache.

---

> *"Stay focused. Every minute is proof of work."*
