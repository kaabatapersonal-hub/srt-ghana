# SRT — Sanitation Resilience Tracker

A climate-resilient sanitation monitoring platform built for the **UNICEF StartUp Lab Hackathon 2026**.

---

## Problem Statement

Northern Ghana faces acute sanitation challenges compounded by seasonal flooding. Existing monitoring relies on paper-based field reports that are slow, disconnected, and lost during flood events. Field agents need a lightweight, mobile-first tool to log facility conditions in real time — even without an internet connection — so decision-makers can identify and act on critical sanitation failures before they become public health crises.

---

## What It Does

- **Field Reporting** — Agents submit structured reports (facility name, type, condition, notes, GPS coordinates) via a 4-step mobile form
- **Admin Review** — Admins approve or reject submitted reports through a moderated dashboard with stats and charts
- **Interactive Map** — All reports with GPS appear as color-coded markers (Good / Fair / Poor / Critical) on a Leaflet map centered on Northern Ghana
- **Climate Risk Layer** — Toggle flood-risk zone overlays for Tolon, Kumbungu, Savelugu, and Tamale South districts
- **Offline Support** — Reports submitted without connectivity are queued in localStorage and auto-synced when connection returns
- **PWA** — Installable on Android and iOS; loads fully offline after first visit

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite |
| Auth | Firebase Authentication (Email/Password) |
| Database | Firebase Firestore (real-time `onSnapshot`) |
| Hosting | Firebase Hosting (Spark plan) |
| Maps | react-leaflet v5 + Leaflet 1.9.4 |
| Charts | Recharts (BarChart, PieChart) |
| PWA | vite-plugin-pwa (Workbox) |
| Styling | Custom CSS with design tokens |

---

## Local Development

### Prerequisites

- Node.js 18+
- A Firebase project with Firestore and Authentication enabled

### Setup

```bash
git clone https://github.com/kaabatapersonal-hub/srt-ghana.git
cd srt-ghana/srt-app
npm install
```

Create `.env.local` in `srt-app/` with your Firebase config:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Run

```bash
npm run dev
```

App runs at `http://localhost:5173`.

### Build

```bash
npm run build
```

### Deploy to Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

---

## Role System

Roles are stored in Firestore at `/users/{uid}/role`.

- Default role after registration: `field_agent`
- To grant admin access: set `role: "admin"` manually in Firestore Console

---

## Screenshots

*Coming soon*

---

## Team

*Add your team members here*

---

## Live Demo

*https://srt-ghana.web.app*

---

## License

MIT
