<div align="center">

# 🌸 Kawaii Habit Tracker

### *A living world that grows with you~*

**An emotionally intelligent habit tracker with a cat companion who remembers, feels, and evolves.**

[![Live Demo](https://img.shields.io/badge/Live-kawaii--habit--tracker.vercel.app-FF85A2?style=for-the-badge)](https://kawaii-habit-tracker.vercel.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![PWA](https://img.shields.io/badge/PWA-Installable-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](#-install-as-app)
[![GitHub](https://img.shields.io/badge/GitHub-TheAlgo7-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/TheAlgo7)

---

*Not a to-do list. A relationship. Your cat companion Neko develops trust, forms memories, gets sad when you're gone, and builds a world around your habits — one that wilts if you stop showing up.*

</div>

<br>

## ✿ What This Is

A **single-page React PWA** designed as a behavioral habit tracker disguised as a kawaii companion experience. Everything runs client-side with `localStorage` — no backend, no accounts, no data leaves your device.

The core loop: **complete habits → Neko trusts you more → the world grows → new things unlock → you want to come back.**

<br>

## 🌍 Live Demo

**→ [kawaii-habit-tracker.vercel.app](https://kawaii-habit-tracker.vercel.app)**

Open on mobile for the best experience. Install it to your home screen — it runs fullscreen like a native app.

<br>

## 🗂️ Project Structure

```
kawaii-habit-tracker/
│
├── index.html              → PWA-enabled HTML shell
├── vercel.json             → SPA rewrite rules
├── package.json            → React 19 + Vite 8
├── vite.config.js          → Vite configuration
│
├── public/
│   ├── manifest.json       → PWA manifest (standalone, portrait)
│   ├── sw.js               → Service worker (offline caching)
│   ├── icon-192.svg        → Home screen icon (kawaii cat)
│   ├── icon-512.svg        → Splash screen icon
│   └── icons.svg           → SVG icon sprites
│
├── src/
│   ├── main.jsx            → React DOM entry point
│   ├── App.jsx             → Root component
│   ├── App.css             → Base styles
│   ├── index.css           → Global resets
│   └── KawaiiHabit.jsx     → ⭐ Entire app (3000+ lines — UI, logic, styles, systems)
│
├── .gitignore
└── README.md
```

<br>

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 (functional components, hooks, refs) |
| **Build Tool** | Vite 8 (HMR, fast refresh) |
| **PWA** | Service worker + Web App Manifest (installable, offline-capable) |
| **Styling** | CSS-in-JSX — scoped `<style>` block with `:root` design tokens |
| **Typography** | Google Fonts — Quicksand (headings), Nunito (body) |
| **Icons** | Native emoji system + custom SVG sprites |
| **Storage** | `localStorage` — 13 keys for all state persistence |
| **State** | `useState`, `useEffect`, `useRef`, `useCallback` |
| **Animations** | CSS transitions, cubic-bezier curves, confetti particles |
| **Deploy** | Vercel (auto-deploy on push) |
| **Linting** | ESLint 9 with React Hooks plugin |

<br>

## 🎨 Design Philosophy

- **Hyper-kawaii aesthetic.** Pastel pinks, soft peach tones, rounded corners everywhere.
- **Mobile-first.** Designed at 412px viewport. Scales gracefully with `max-width: 430px` container.
- **Glass-card UI.** Layered cards with pink-toned shadows and hover lift effects.
- **Dynamic Theming.** Full support for customizable color schemes, including a stunning dark "Midnight" mode with CSS variable-driven dynamic UI adaptation.
- **Emotionally designed.** UI elements respond to Neko's mood — subtle shifts you feel but don't consciously notice.
- **Zero dependencies for UI.** No component library — every button, card, modal, and animation is handcrafted.

<br>

## 🧩 Core Features

### Productivity

| Feature | Description |
|---|---|
| **Daily Habits** | Create habits with custom emojis, track completions, view streaks |
| **To-do Lists** | Quick tasks with category tags (Personal, Work, Health, etc.) |
| **7-Day Challenges** | Short-term challenges with daily progress tracking |
| **30-Day Challenges** | Long-term challenges with visual progress grids |
| **Streak Tracking** | Consecutive day tracking per habit, future-date safe |
| **Progress Ring** | Animated progress bar showing daily completion rate |

### Neko Companion System

| Feature | Description |
|---|---|
| **Personality Engine** | Trust & sadness values that shift based on your behavior |
| **Relationship Levels** | Shy → Comfy → Close → Bonded — unlocks over time with friction |
| **Memory System** | Neko forms memories (5 types, 4 rarity tiers) and recalls them emotionally |
| **Mood-Aware Dialogue** | Idle messages change based on mood, time of day, relationship level |
| **Multilingual Awareness**| Gracefully acknowledges non-English greetings (Hola, こんにちは, 안녕하세요, etc.) even while operating primarily in English |
| **Random Thoughts** | ~10% chance Neko says something off-topic and personal |
| **Silent Smiles** | ~8% chance Neko just smiles instead of talking |
| **Neko Initiation** | Neko nudges you if idle, with jittered timing so it feels natural |
| **Routine Detection** | Tracks which hours you open the app, detects 3-day patterns |

### Living World

| Feature | Description |
|---|---|
| **Environment Objects** | 5 objects that grow through 3 stages based on habit completion |
| **Wilt System** | Objects wilt if you stop showing up |
| **World Naming** | Name your world — it becomes part of the emotional identity |
| **Reveal System** | Environment upgrades unlock as you hit milestones |
| **Milestones** | Achievement system tracking streaks, completions, days active |

### Behavioral Design

| Feature | Description |
|---|---|
| **Onboarding Flow** | 4-step emotional onboarding — Neko appears, you name them, world awakens |
| **Anticipation Engine** | ~20% mystery messages, hidden progress elements |
| **Reward Spacing** | 6-hour minimum between major reveals to prevent burnout |
| **Sadness Cap** | Guilt halves when sadness > 60 — the app never punishes too hard |
| **Monetization Tease** | Tappable locked item appears after 5+ days (placeholder for future) |

<br>

## 📱 Install as App

This is a **Progressive Web App**. On mobile:

1. Open [kawaii-habit-tracker.vercel.app](https://kawaii-habit-tracker.vercel.app) in Chrome
2. Tap the browser menu → **"Add to Home Screen"**
3. It launches fullscreen with the kawaii cat icon — no browser bar

Works offline after first load.

<br>

## 🎭 How Neko Works

Neko isn't a chatbot — it's a **behavioral companion** with persistent emotional state.

| Mechanic | How It Works |
|---|---|
| **Trust** | Increases when you complete habits. Guarded on first load so it doesn't spike. |
| **Sadness** | Increases when you're absent. Capped so it never feels cruel. |
| **Memories** | Stored in localStorage. Neko recalls them as emotional dialogue (~30% chance). |
| **Dialogue State** | Tracked via `useRef` — rotation index, last message type, cooldowns. |
| **Relationship Level** | Derived from trust with friction — doesn't jump instantly on a good day. |
| **Personality** | Persists across sessions. Neko remembers who you are and how you've been. |

<br>

## 💾 Data Persistence

All data lives in `localStorage` under the `kw_` prefix:

| Key | What It Stores |
|---|---|
| `kw_habits` | Habit definitions + completion history |
| `kw_todos` | To-do items |
| `kw_challenges` | Challenge progress |
| `kw_nekoName` | The name you gave your Neko |
| `kw_lastActive` | Last session timestamp |
| `kw_personality` | Trust, sadness, relationship values |
| `kw_milestones` | Achievement unlocks |
| `kw_worldName` | What you named your world |
| `kw_memories` | Neko's formed memories (rarity-tiered) |
| `kw_onboarded` | Whether onboarding has been completed |
| `kw_nekoMemory` | Persistent Neko memory state |
| `kw_openHours` | Hour-of-day usage tracking for routine detection |
| `kw_lastReward` | Timestamp of last major reveal (6h spacing) |

<br>

## 🚀 Run Locally

```bash
git clone https://github.com/TheAlgo7/kawaii-habit-tracker.git
cd kawaii-habit-tracker
npm install
npm run dev
```

Open **http://localhost:5173** on your browser (best on mobile viewport).

<br>

## 🛠️ Build for Production

```bash
npm run build     # Output in dist/
npm run preview   # Preview locally
```

Auto-deploys to Vercel on every push to `main`.

<br>

---

<div align="center">

**Built with 💕 and way too much pink.**

`v2.0` — Emotional companion update · March 2026

<sub>© 2026 Gaurav Kumar · [TheAlgo7](https://github.com/TheAlgo7) · New Delhi, India</sub>

</div>
