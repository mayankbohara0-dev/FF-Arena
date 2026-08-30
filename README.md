<div align="center">

# 🏆 FF ARENA
### India's #1 Dedicated Free Fire Esports Tournament Platform

[![Version](https://img.shields.io/badge/version-1.0.0-FFE600?style=for-the-badge&logo=android&logoColor=black)](https://github.com/mayankbohara0-dev/FF-Arena/releases)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20Web%20PWA-00E5FF?style=for-the-badge)](https://github.com/mayankbohara0-dev/FF-Arena)
[![Stack](https://img.shields.io/badge/Built%20With-React%20%7C%20TypeScript%20%7C%20Capacitor-purple?style=for-the-badge)](https://github.com/mayankbohara0-dev/FF-Arena)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br />

<img src="public/logo.png" alt="FF Arena Logo" width="160" height="160" />

<p align="center">
  <strong>Compete in 48-Player Custom Lobbies • Earn ₹10 Per Kill + ₹20 Booyah Bonus • Instant UPI Direct Payouts</strong>
</p>

[📥 Download Android APK (v1.0.0)](https://github.com/mayankbohara0-dev/FF-Arena/releases/download/v1.0.0/ff-arena-v1.0.apk) • [🌐 Web Landing Page](http://localhost:3000) • [🛡️ Admin Portal](https://github.com/mayankbohara0-dev/FF-Arena)

---

</div>

## 📖 Overview

**FF Arena** is an esports tournament management and competitive gaming platform designed specifically for Free Fire players and community organizers across India.

It features automated 48-player tournament lobbies, real-time slot tracking, custom Room ID & Password broadcasting, AI OCR screenshot scoreboard verification, fair-play anti-cheat sentinel, and direct UPI prize withdrawals to Google Pay, PhonePe, and Paytm.

---

## ⚡ Key Features

### 🎮 1. Competitive 48-Player Match Engine
- **Formats:** Solo, Duo, and Squad tournaments across Bermuda, Kalahari, Purgatory, and Alpine.
- **Entry & Rewards:** ₹15 entry fee with a transparent, skill-based reward formula:
  - **1st Place (Booyah):** Kills × ₹10 + ₹20 Cash Bonus
  - **2nd & 3rd Place:** Kills × ₹10 + ₹15 Cash Bonus
  - **4th to 48th Place:** Kills × ₹10 Per Kill
- **Live Slot Progress:** Dynamic slot tracking (`0/48` to `48/48`) with auto-locking when lobbies are filled.

### 🔑 2. Automated Room ID & Password Delivery
- Secure room credentials unlock automatically inside the app 15 minutes before the match start time, or as soon as 48 slots are booked.
- 1-tap **WhatsApp Broadcast** button for tournament admins to push room details to player groups instantly.

### 💳 3. Direct UPI Prize Payouts
- Mandatory UPI ID collection during slot booking.
- 1-tap direct payment intent links (GPay, PhonePe, Paytm, BHIM) for administrators to disburse winnings with zero platform deduction fees.
- Manual UTR transaction reconciliation for wallet deposits.

### 🤖 4. AI OCR Scoreboard Verification
- Players upload end-game Free Fire scoreboards directly in the app.
- AI OCR extracts player names, kill counts, damage dealt, and placement rankings with 98%+ accuracy within 30 seconds.

### 🛡️ 5. Admin Governance Portal
- Multi-admin whitelist authentication with encrypted password protection.
- Real-time 4-metric statistics banner (Total Players, Fees Collected, Pending Payouts, Active Matches).
- Global player search filter across names, IGNs, Free Fire UIDs, and emails.
- 1-click **CSV Roster Export** per tournament for offline match recording and scoring.

### 🚫 6. Fair-Play Anti-Cheat Sentinel
- Mobile-only enforcement with hardware and emulator detection to eliminate PC/emulator advantages.
- Dispute management and match review queue.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool** | [Vite 6](https://vitejs.dev/) |
| **Mobile Runtime** | [Capacitor 8](https://capacitorjs.com/) (Android Native + Web PWA) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) + Custom Glassmorphic Dark UI |
| **Icons & Sounds** | [Lucide React](https://lucide.dev/) + Web Audio API Synthesis |
| **Backend & Auth** | [Supabase](https://supabase.com/) (Email OTP Authentication + PostgreSQL) |
| **Native Android** | Java 21 / Gradle 9 / Android SDK 36 |

---

## 📁 Project Architecture

```
ff-arena/
├── android/                   # Native Android Capacitor Project
│   ├── app/
│   │   ├── src/main/res/      # App Launcher Icons & Splash Screens
│   │   └── build.gradle       # Android Application Gradle Config
│   └── build.gradle           # Root Gradle Build File
├── public/                    # Static Assets & PWA Config
│   ├── logo.png               # Official High-Res Esports Crest
│   ├── favicon.png            # Web App Icon
│   └── ff-arena-v1.0.apk      # Compiled Android Release Binary
├── src/
│   ├── components/
│   │   ├── admin/             # Admin Governance Dashboard & Payout Queues
│   │   ├── landing/           # Pure APK Download & Promotion Landing Page
│   │   ├── mobile/            # Player Mobile App UI, Tabs, Modals & Drawers
│   │   └── common/            # Shared Badges, Stat Cards & Drawers
│   ├── context/               # Global State Management (AppContext)
│   ├── services/              # Auth, Sound, Anti-Cheat & Mock Data Services
│   ├── supabase/              # Supabase Client & OTP Auth Handlers
│   ├── types/                 # TypeScript Domain Interfaces & Types
│   ├── App.tsx                # App Entry Point & Platform Routing
│   ├── index.css              # Global Styling Tokens & Animations
│   └── main.tsx               # DOM Mount & PWA Service Worker Init
├── capacitor.config.ts        # Capacitor App & Package Configuration
├── package.json               # Dependencies & NPM Scripts
├── vite.config.ts             # Vite Bundler Configuration
└── README.md                  # Project Documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Android Studio](https://developer.android.com/studio) (with JDK 21 and Android SDK 36 for APK builds)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/mayankbohara0-dev/FF-Arena.git
cd FF-Arena
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to view the Landing Page and App.

### 3. Build Web Production Bundle
```bash
npm run build
```

---

## 📱 Building the Android APK

### Step 1: Sync Web Assets to Android Project
```bash
npx cap sync android
```

### Step 2: Build Debug APK via Gradle CLI
```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
cd android
.\gradlew.bat assembleDebug
```
The output APK is generated at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Step 3: Open in Android Studio (Optional)
```bash
npx cap open android
```
In Android Studio: Select **Build → Build Bundle(s) / APK(s) → Build APK(s)**.

---

## 🔐 Administrator Access

FF Arena uses a multi-tier whitelisted administrator system. Official admin accounts enter their email to trigger the secure password unlock screen directly:

| Role | Access Level |
|---|---|
| **SUPER_ADMIN** | Full tournament creation, room broadcast, payout processing, CSV export & admin management |
| **ADMIN** | Tournament governance, match validation, result processing & anti-cheat moderation |

---

## ⚖️ Legal & Compliance Notice

- **Skill-Based Competition:** FF Arena operates as a skill-based esports platform compliant with Indian regulatory standards for non-wagering skill tournaments.
- **Independent Community Platform:** FF Arena is an independent community esports application and is not officially affiliated with or endorsed by Garena or Free Fire.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

<div align="center">
  <sub>Built with ❤️ for the Indian Free Fire Esports Community.</sub>
</div>
